import {
  AttributeValue,
  CreateTableCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
  ScanCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import type {
  ListSourcesFilters,
  Source,
  SourceCollectionItem,
  SourceRepository,
  ListSourcesResponse,
} from "../../repository";
import { InvalidPageTokenError } from "../../repository/errors";
import { createInjectionToken, inject } from "../../di";
import { dynamodbClientToken, dynamodbConfigToken } from "./client";

export const SourceTableNameToken = createInjectionToken<string>(
  "SourceTableName",
  {
    useFactory: () => inject(dynamodbConfigToken).sourceTableName,
  }
);

export class DDBSourcesRepository implements SourceRepository {
  private readonly client: DynamoDBClient = inject(dynamodbClientToken);
  private readonly tableName = inject(SourceTableNameToken);

  public async createTable() {
    await this.client.send(
      new CreateTableCommand({
        TableName: this.tableName,
        AttributeDefinitions: [
          {
            AttributeName: "id",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "id",
            KeyType: "HASH",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  }

  private encodePageToken(
    lastEvaluatedKey: Record<string, AttributeValue>
  ): string {
    return Buffer.from(JSON.stringify(lastEvaluatedKey), "utf8").toString(
      "base64url"
    );
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
      id: data.id,
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
    };
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
      const keyName = `#key${nameInc}`;
      const valueName = `:tag_${nameInc}`;
      nameInc++;

      filterExpr.push(
        `(tags.${keyName} = ${valueName} OR contains(tags.${keyName}, ${valueName}))`
      );

      exprAttrVal[valueName] = {
        S: typeof value === "string" ? value : value[0],
      };
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
      TableName: this.tableName,
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
        throw new InvalidPageTokenError();
      }
    }

    if (filters?.limit) {
      scanParams.Limit = filters.limit;
    }

    const resp = await this.client.send(new ScanCommand(scanParams));
    const nextPageToken = resp.LastEvaluatedKey
      ? this.encodePageToken(resp.LastEvaluatedKey)
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
        TableName: this.tableName,
        Key: {
          id: {
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
        TableName: this.tableName,
        ReturnValues: "NONE",
        Item: this.sourceToRecord(source),
      })
    );
    return source;
  }

  async deleteSource(sourceId: string): Promise<boolean> {
    const source = await this.getSourceById(sourceId);
    if (!source) return false;

    await this.client.send(
      new DeleteItemCommand({
        TableName: this.tableName,
        Key: {
          id: { S: sourceId },
        },
      })
    );
    return true;
  }
}
