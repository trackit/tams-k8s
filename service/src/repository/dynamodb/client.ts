import { createInjectionToken, inject } from "../../di";
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  DynamoDBClientConfig,
  ResourceNotFoundException,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBConfig } from "../../configParser";
import { log } from "@tams-k8s/logger";

export const dynamodbConfigToken =
  createInjectionToken<DynamoDBConfig>("dynamodbConfig");

export const dynamodbClientToken = createInjectionToken<DynamoDBClient>(
  "dynamodbClient",
  {
    useFactory: () => {
      const config = inject(dynamodbConfigToken);
      const clientConfig: DynamoDBClientConfig = {
        region: config.region || "us-west-2",
      };
      if (config.endpoint) clientConfig.endpoint = config.endpoint;

      return new DynamoDBClient(clientConfig);
    },
  }
);

const ensureTableExists = async (
  client: DynamoDBClient,
  tableName: string,
  createTable: () => Promise<void>
): Promise<void> => {
  try {
    await client.send(
      new DescribeTableCommand({
        TableName: tableName,
      })
    );
  } catch (e) {
    if (e instanceof ResourceNotFoundException) {
      log.info("DynamoDB table not found, creating...", { tableName });
      await createTable();
      log.info("DynamoDB table created", { tableName });
    } else {
      log.error("Could not verify DynamoDB table existence", {
        tableName,
        error: e instanceof Error ? e.message : String(e),
      });
      throw e;
    }
  }
};

export const ensureDynamoTables = async (): Promise<void> => {
  const config: DynamoDBConfig = inject(dynamodbConfigToken);
  const client = inject(dynamodbClientToken);

  await ensureTableExists(client, config.serviceTableName, async () => {
    await client.send(
      new CreateTableCommand({
        TableName: config.serviceTableName,
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
  });

  await ensureTableExists(client, config.flowTableName, async () => {
    await client.send(
      new CreateTableCommand({
        TableName: config.flowTableName,
        AttributeDefinitions: [
          {
            AttributeName: "flowId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "flowId",
            KeyType: "HASH",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  });

  await ensureTableExists(client, config.sourceTableName, async () => {
    await client.send(
      new CreateTableCommand({
        TableName: config.sourceTableName,
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
  });

  await ensureTableExists(client, config.mediaObjectTableName, async () => {
    await client.send(
      new CreateTableCommand({
        TableName: config.mediaObjectTableName,
        AttributeDefinitions: [
          {
            AttributeName: "objectId",
            AttributeType: "S",
          },
        ],
        KeySchema: [
          {
            AttributeName: "objectId",
            KeyType: "HASH",
          },
        ],
        BillingMode: "PAY_PER_REQUEST",
      })
    );
  });

  await ensureTableExists(
    client,
    config.flowDeleteRequestsTableName,
    async () => {
      await client.send(
        new CreateTableCommand({
          TableName: config.flowDeleteRequestsTableName,
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
  );
};
