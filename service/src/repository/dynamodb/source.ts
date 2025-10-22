import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBConfig } from "../../configParser";
import type {
  ListSourcesFilters,
  Source,
  SourceCollectionItem,
  SourceRepository,
  ListSourcesResponse,
} from "../source";
import { InvalidPageTokenError } from "repository/errors";

export class DDBSourcesImpl implements SourceRepository {
  private readonly client: DynamoDBClient;
  private readonly config: DynamoDBConfig;

  constructor(client: DynamoDBClient, config: DynamoDBConfig) {
    this.client = client;
    this.config = config;
  }

  private encodePageToken(sourceId: string) {
    return Buffer.from(sourceId, "utf8").toString("base64url");
  }

  private sourceCollectionItemRecordToSourceCollectionItem(
    data: Record<string, any>
  ): SourceCollectionItem {
    return {
      id: data.id,
      role: data.role,
    };
  }

  private sourceToRecord(source: Source): Record<string, AttributeValue> {
    return marshall(
      {
        ...source,
        created: source.created?.toString(),
        updated: source.updated?.toString(),
      },
      { removeUndefinedValues: true }
    );
  }

  private recordToSource(record: Record<string, AttributeValue>): Source {
    const data = unmarshall(record);
    return {
      id: data.sourceId,
      label: data.label,
      format: data.format,
      description: data.description,
      tags: data.tags,
      created: data.created ? new Date(data.created) : undefined,
      updated: data.updated ? new Date(data.updated) : undefined,
      createdBy: data.createdBy,
      updatedBy: data.updatedBy,
      collectedBy: data.collectedBy,
      sourceCollection: data.sourceCollection?.map(
        this.sourceCollectionItemRecordToSourceCollectionItem.bind(this)
      ),
    } as Source;
  }

  private recordsToSources(
    records: Record<string, AttributeValue>[]
  ): Source[] {
    return records.map((record) => this.recordToSource(record));
  }

  async listSources(
    filters?: ListSourcesFilters
  ): Promise<ListSourcesResponse> {
    const filterExpr: string[] = [];
    const exprAttrVal: Record<string, AttributeValue> = {};
    const exprAttrNames: Record<string, string> = {};
    let nameInc = 0;

    if (filters?.label) {
      filterExpr.push("label = :label");
      exprAttrVal[":label"] = { S: filters.label };
    }

    if (filters?.format) {
      filterExpr.push("#format = :format");
      exprAttrVal[":format"] = { S: filters.format };
      exprAttrNames["#format"] = "format";
    }

    Object.entries(filters?.tags ?? {}).forEach(([key, value]) => {
      const keyName = `#key${nameInc++}`;
      filterExpr.push(`tags.${keyName} = :tag_${key}`);
      exprAttrVal[`:tag_${key}`] = { S: value };
      exprAttrNames[keyName] = key;
    });

    filters?.haveTags?.forEach((key) => {
      const keyName = `#key${nameInc++}`;
      filterExpr.push(`attribute_exists(tags.${keyName})`);
      exprAttrNames[keyName] = key;
    });

    filters?.doesNotHaveTags?.forEach((key) => {
      const keyName = `#key${nameInc++}`;
      filterExpr.push(`attribute_not_exists(tags.${keyName})`);
      exprAttrNames[keyName] = key;
    });

    const scanParams: ScanCommandInput = {
      TableName: this.config.sourceTableName,
      FilterExpression:
        filterExpr.length === 0 ? undefined : filterExpr.join(" AND "),
      ExpressionAttributeNames:
        Object.keys(exprAttrNames).length > 0 ? exprAttrNames : undefined,
      ExpressionAttributeValues:
        Object.keys(exprAttrVal).length > 0 ? exprAttrVal : undefined,
    };

    if (filters?.page) {
      try {
        scanParams.ExclusiveStartKey = JSON.parse(
          Buffer.from(filters.page, "base64").toString("utf-8")
        );
      } catch (error) {
        new InvalidPageTokenError();
      }
    }

    if (filters?.limit) {
      scanParams.Limit = filters.limit;
    }

    const resp = await this.client.send(new ScanCommand(scanParams));
    const nextPageToken = resp.LastEvaluatedKey?.sourceId?.S
      ? this.encodePageToken(resp.LastEvaluatedKey.sourceId.S)
      : undefined;

    return {
      sources: !resp.Items ? [] : this.recordsToSources(resp.Items),
      limit: filters?.limit,
      nextPageToken: nextPageToken,
    };
  }

  async getSourceById(sourceId: string): Promise<Source | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.config.sourceTableName,
        Key: {
          sourceId: {
            S: sourceId,
          },
        },
      })
    );
    if (!result.Item) return null;
    return this.recordToSource(result.Item);
  }

  async putSource(source: Source): Promise<Source> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.config.sourceTableName,
        ReturnValues: "NONE",
        Item: this.sourceToRecord(source),
      })
    );
    return source;
  }
}
