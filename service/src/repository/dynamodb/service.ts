import {
  CreateTableCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { Service, ServiceRepository, ServiceUpdate } from "../service";
import { createInjectionToken, inject } from "../../di";
import { dynamodbClientToken, dynamodbConfigToken } from "./client";

export const ServiceTableNameToken = createInjectionToken<string>(
  "ServiceTableName",
  {
    useFactory: () => inject(dynamodbConfigToken).serviceTableName,
  }
);

export class DDBServiceRepository implements ServiceRepository {
  private readonly client: DynamoDBClient = inject(dynamodbClientToken);
  private readonly tableName = inject(ServiceTableNameToken);

  public async createTable() {
    await this.client.send(
      new CreateTableCommand({
        TableName: this.tableName,
        AttributeDefinitions: [
          {
            AttributeName: "serviceKey",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "serviceKey",
            KeyType: "HASH",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  }

  async getService(): Promise<Service> {
    const resp = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: {
          serviceKey: {
            S: "service",
          },
        },
      })
    );
    if (!resp.Item) {
      return {
        name: "",
        description: "",
      };
    }
    const data = unmarshall(resp.Item);
    return {
      name: data.name,
      description: data.description,
    };
  }

  async updateService(next: ServiceUpdate): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        Item: marshall({
          serviceKey: "service",
          name: next.name,
          description: next.description ?? "",
        }),
      })
    );
  }
}
