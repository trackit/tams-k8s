import {
  DynamoDBClient,
  ScanCommand,
  DeleteItemCommand,
  DescribeTableCommand,
} from "@aws-sdk/client-dynamodb";

export const clearDynamoTable = async (
  tableName: string,
  region = "us-west-2",
  endpoint?: string,
) => {
  const client = new DynamoDBClient({ region, endpoint });

  const describeTable = await client.send(new DescribeTableCommand({ TableName: tableName }));
  const keySchema = describeTable.Table?.KeySchema;

  if (!keySchema || keySchema.length === 0)
    throw new Error("Unable to retrieve the primary key");

  const scanResult = await client.send(new ScanCommand({ TableName: tableName }));

  if (!scanResult.Items || scanResult.Items.length === 0) return;

  for (const item of scanResult.Items) {
    const key: Record<string, any> = {};

    keySchema.forEach(({ AttributeName }) => {
      if (AttributeName) {
        if (!(AttributeName in item)) {
          throw new Error(`Item does not have the expected primary key: ${AttributeName}`);
        }
        key[AttributeName] = item[AttributeName];
      }
    });

    await client.send(new DeleteItemCommand({ TableName: tableName, Key: key }));
  }
};
