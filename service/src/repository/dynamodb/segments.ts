import {
  AttributeValue,
  BatchWriteItemCommand,
  CreateTableCommand,
  DynamoDBClient,
  QueryCommand,
  ResourceNotFoundException,
  WriteRequest,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import Joi from "joi";
import { parseTimerange } from '@tams-k8s/api';
import { catchError } from '../../helper';
import { InvalidPageTokenError } from "../errors";
import type {
  CreateSegmentsResult,
  DeleteSegmentsFilters,
  GetUrl,
  ListSegmentsFilters,
  ListSegmentsResponse,
  Segment,
  SegmentFailure,
  SegmentRepository,
} from "../segments";
import { createInjectionToken, inject } from "../../di";
import { dynamodbClientToken, dynamodbConfigToken } from "./client";

export const SegmentTableNameToken = createInjectionToken<string>(
  "SegmentTableName",
  {
    useFactory: () => inject(dynamodbConfigToken).segmentTableName,
  }
);

const BATCH_SIZE = 25;

export class DDBSegmentsRepository implements SegmentRepository {
  private readonly client: DynamoDBClient = inject(dynamodbClientToken);
  private readonly tableName = inject(SegmentTableNameToken);

  public async createTable() {
    await this.client.send(
      new CreateTableCommand({
        TableName: this.tableName,
        AttributeDefinitions: [
          {
            AttributeName: "flowId",
            AttributeType: "S",
          },
          {
            AttributeName: "objectId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "flowId",
            KeyType: "HASH",
          },
          {
            AttributeName: "objectId",
            KeyType: "RANGE",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  }

  private segmentToRecord(segment: Segment): Record<string, AttributeValue> {
    const tr = parseTimerange(segment.timerange);

    const record: Record<string, any> = {
      flowId: segment.flowId,
      objectId: segment.objectId,
      timerange: segment.timerange,
      ...(tr?.start !== undefined && isFinite(tr.start) && { timerangeStart: tr.start }),
      ...(tr?.end !== undefined && isFinite(tr.end) && { timerangeEnd: tr.end }),
      ...(segment.tsOffset && { tsOffset: segment.tsOffset }),
      ...(segment.lastDuration && { lastDuration: segment.lastDuration }),
      ...(segment.objectTimerange && {
        objectTimerange: segment.objectTimerange,
      }),
      ...(segment.sampleOffset !== undefined && {
        sampleOffset: segment.sampleOffset,
      }),
      ...(segment.sampleCount !== undefined && {
        sampleCount: segment.sampleCount,
      }),
      ...(segment.getUrls && { getUrls: segment.getUrls }),
      ...(segment.keyFrameCount !== undefined && {
        keyFrameCount: segment.keyFrameCount,
      }),
    };

    return marshall(record, { removeUndefinedValues: true });
  }

  private recordToSegment(record: Record<string, AttributeValue>): Segment {
    const data = unmarshall(record);

    return {
      flowId: data.flowId,
      objectId: data.objectId,
      timerange: data.timerange,
      tsOffset: data.tsOffset,
      lastDuration: data.lastDuration,
      objectTimerange: data.objectTimerange,
      sampleOffset: data.sampleOffset,
      sampleCount: data.sampleCount,
      getUrls: data.getUrls as GetUrl[] | undefined,
      keyFrameCount: data.keyFrameCount,
    };
  }

  private encodePageToken(objectId: string): string {
    return Buffer.from(objectId, "utf8").toString("base64url");
  }

  private decodePageToken(pageToken: string): string {
    try {
      const decoded = Buffer.from(pageToken, "base64url").toString("utf8");
      // Validate that it's a non-empty string
      Joi.assert(decoded, Joi.string().min(1).required());
      return decoded;
    } catch (e) {
      throw new InvalidPageTokenError();
    }
  }

  async listSegments(
    filters: ListSegmentsFilters
  ): Promise<ListSegmentsResponse> {
    const filterExpr: string[] = [];
    const exprAttrVal: Record<string, AttributeValue> = {};

    // Build KeyConditionExpression - objectId is the sort key
    let keyConditionExpression = "flowId = :flowId";
    if (filters.objectId) {
      keyConditionExpression += " AND objectId = :objectId";
      exprAttrVal[":objectId"] = { S: filters.objectId };
    }

    // TODO: Implement timerange overlap filtering when PR #27 is merged
    // For now, we'll accept the parameter but not filter by it
    if (filters.timerange) {
      const tr = parseTimerange(filters.timerange);
      if (tr) {
        const hasFiniteStart = isFinite(tr.start);
        const hasFiniteEnd = isFinite(tr.end);

        // Only filter if we have at least one finite bound
        if (hasFiniteStart || hasFiniteEnd) {
          const conditions: string[] = [
            "attribute_exists(timerangeStart)",
            "attribute_exists(timerangeEnd)"
          ];

          // For overlap: segmentEnd > queryStart AND segmentStart < queryEnd
          if (hasFiniteStart) {
            conditions.push("timerangeEnd > :queryStart");
            exprAttrVal[":queryStart"] = { N: tr.start.toString() };
          }

          if (hasFiniteEnd) {
            conditions.push("timerangeStart < :queryEnd");
            exprAttrVal[":queryEnd"] = { N: tr.end.toString() };
          }

          filterExpr.push(`(${conditions.join(" AND ")})`);
        }
      }
    }

    let exclusiveStartKey: Record<string, AttributeValue> | undefined =
      undefined;
    if (filters.pageToken) {
      const decoded = this.decodePageToken(filters.pageToken);
      exclusiveStartKey = marshall({
        flowId: filters.flowId,
        objectId: decoded,
      });
    }

    const [error, resp] = await catchError(this.client.send(
      new QueryCommand({
        TableName: this.tableName,
        KeyConditionExpression: keyConditionExpression,
        FilterExpression:
          filterExpr.length === 0 ? undefined : filterExpr.join(" AND "),
        ExpressionAttributeValues: {
          ":flowId": { S: filters.flowId },
          ...exprAttrVal,
        },
        Limit: filters.limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: !filters.reverseOrder,
      })
    ));

    if (error) {
      if (error instanceof ResourceNotFoundException) {
        return { segments: [], limit: filters.limit, nextPageToken: undefined };
      }
      throw error;
    }

    const segments = !resp.Items
      ? []
      : resp.Items.map((item) => this.recordToSegment(item));

    // TODO: Handle includeObjectTimerange parameter - filter out object_timerange field if false

    return {
      segments,
      limit: filters.limit,
      nextPageToken: resp.LastEvaluatedKey?.objectId?.S
        ? this.encodePageToken(resp.LastEvaluatedKey.objectId.S)
        : undefined,
    };
  }

  async createSegments(
    flowId: string,
    segments: Segment[]
  ): Promise<CreateSegmentsResult> {
    const created: Segment[] = [];
    const failed: SegmentFailure[] = [];

    const segmentsToCreate = segments.map((segment) => ({
      ...segment,
      flowId,
    }));

    const batches: Segment[][] = [];
    for (let i = 0; i < segmentsToCreate.length; i += BATCH_SIZE) {
      batches.push(segmentsToCreate.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      try {
        const writeRequests: WriteRequest[] = batch.map((segment) => ({
          PutRequest: {
            Item: this.segmentToRecord(segment),
          },
        }));

        const response = await this.client.send(
          new BatchWriteItemCommand({
            RequestItems: {
              [this.tableName]: writeRequests,
            },
          })
        );

        const unprocessedObjectIds = new Set(
          response.UnprocessedItems?.[this.tableName]?.map((item) => {
            const unmarshalled = unmarshall(item.PutRequest?.Item || {});
            return unmarshalled.objectId;
          }) || []
        );

        for (const segment of batch) {
          if (!unprocessedObjectIds.has(segment.objectId)) {
            created.push(segment);
          } else {
            failed.push({
              objectId: segment.objectId,
              timerange: segment.timerange,
              error: "Failed to write item"
            });
          }
        }
      } catch (error) {
        for (const segment of batch) {
          failed.push({
            objectId: segment.objectId,
            timerange: segment.timerange,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return {
      created,
      failed: failed.length > 0 ? failed : undefined,
    };
  }

  async deleteSegments(
    flowId: string,
    filters: DeleteSegmentsFilters
  ): Promise<void> {
    // First, list all segments matching the filters
    const listFilters: ListSegmentsFilters = {
      flowId,
      objectId: filters.objectId,
      timerange: filters.timerange,
    };

    let allSegments: Segment[] = [];
    let nextPageToken: string | undefined = undefined;

    do {
      const response = await this.listSegments({
        ...listFilters,
        pageToken: nextPageToken,
      });
      allSegments = allSegments.concat(response.segments);
      nextPageToken = response.nextPageToken;
    } while (nextPageToken);

    const batches: Segment[][] = [];
    for (let i = 0; i < allSegments.length; i += BATCH_SIZE) {
      batches.push(allSegments.slice(i, i + BATCH_SIZE));
    }

    for (const batch of batches) {
      const writeRequests: WriteRequest[] = batch.map((segment) => ({
        DeleteRequest: {
          Key: marshall({
            flowId: segment.flowId,
            objectId: segment.objectId,
          }),
        },
      }));

      const response = await this.client.send(
        new BatchWriteItemCommand({
          RequestItems: {
            [this.tableName]: writeRequests,
          },
        })
      );

      const unprocessedItems = response.UnprocessedItems?.[this.tableName];
      if (unprocessedItems && unprocessedItems.length > 0) {
        throw new Error(
          `Failed to delete ${unprocessedItems.length} segments`
        );
      }
    }
  }
}
