import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import Joi from "joi";
import { DynamoDBConfig } from "../../configParser";
import { FlowDeleteRequest, FlowDeleteRequestsRepository } from "../flowDeleteRequests";

export class DDBFlowDeleteRequestsImpl implements FlowDeleteRequestsRepository {
  private readonly client: DynamoDBClient;
  private readonly config: DynamoDBConfig;

  constructor(client: DynamoDBClient, config: DynamoDBConfig) {
    this.client = client;
    this.config = config;
  }

  private flowDeleteRequestToRecord(request: FlowDeleteRequest): Record<string, AttributeValue> {
    return marshall({
      ...request,
      created: request.created?.toString(),
      updated: request.updated?.toString(),
    });
  }

  private recordToFlowDeleteRequest(record: Record<string, AttributeValue>): FlowDeleteRequest {
    const flowDeleteRequest = unmarshall(record);
    return {
      id: flowDeleteRequest.id,
      flowId: flowDeleteRequest.flow_id,
      timerange: flowDeleteRequest.timerange,
      status: flowDeleteRequest.status,
      progress: flowDeleteRequest.progress,
      created: flowDeleteRequest.created,
      updated: flowDeleteRequest.updated,
      errorMessage: flowDeleteRequest.error_message,
      metadata: flowDeleteRequest.metadata,
    };
  }

  private recordToFlowDeleteRequests(records: Record<string, AttributeValue>[]) {
    return records.map(record => this.recordToFlowDeleteRequest(record));
  }

  async listFlowDeleteRequest(): Promise<FlowDeleteRequest[]> {
    const resp = await this.client.send(
      new ScanCommand({
        TableName: this.config.flowDeleteRequestsTableName,
      }),
    );
    return !resp.Items ? [] : this.recordToFlowDeleteRequests(resp.Items);
  }

  async getFlowDeleteRequestById(flowDeleteRequestId: string): Promise<FlowDeleteRequest | null> {
    const result = await this.client.send(
      new GetItemCommand({
        TableName: this.config.flowDeleteRequestsTableName,
        Key: {
          id: {
            S: flowDeleteRequestId,
          },
        },
      }),
    );
    if (!result.Item) return null;
    return this.recordToFlowDeleteRequest(result.Item);
  }
}
