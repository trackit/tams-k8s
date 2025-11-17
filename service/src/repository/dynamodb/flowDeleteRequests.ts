import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBConfig } from "../../configParser";
import { FlowDeleteRequestsRepository } from "../flowDeleteRequests";
import { ErrorMetadata, FlowDeleteRequest } from "../../api/";
import { dynamodbClientToken, dynamodbConfigToken } from "./client";
import { inject } from "../../di";

export class DDBFlowDeleteRequestsImpl implements FlowDeleteRequestsRepository {
  private readonly client: DynamoDBClient = inject(dynamodbClientToken)
  private readonly config: DynamoDBConfig = inject(dynamodbConfigToken)

  private ErrorMetadataRecordToRequest(data: Record<string, any>): ErrorMetadata {
    return {
      type: data.type,
      summary: data.summary,
      traceback: data.traceback,
      time: data.time,
    };
  }

  private recordToFlowDeleteRequest(record: Record<string, AttributeValue>): FlowDeleteRequest {
    const data = unmarshall(record);
    return {
      id: data.id,
      flowId: data.flowId,
      timerangeToDelete: data.timerangeToDelete,
      timerangeRemaining: data.timerangeRemaining,
      deleteFlow: data.deleteFlow,
      progress: data.progress,
      created: data.created,
      createdBy: data.createdBy,
      updated: data.updated,
      expiry: data.expiry,
      status: data.status,
      error: data.error ? this.ErrorMetadataRecordToRequest(data.error) : undefined,
    };
  }

  private recordToFlowDeleteRequests(records: Record<string, AttributeValue>[]) {
    return records.map(record => this.recordToFlowDeleteRequest(record));
  }

  private ErrorMetadataToRecord(error: ErrorMetadata): Record<string, AttributeValue> {
    return marshall(
      {
        ...error,
        traceback: error.traceback ?? [],
        time: error.time?.toString(),
      },
      { removeUndefinedValues: true },
    );
  }

  private flowDeleteRequestToRecord(request: FlowDeleteRequest): Record<string, AttributeValue> {
    return marshall(
      {
        ...request,
        created: request.created?.toString(),
        updated: request.updated?.toString(),
        expiry: request.expiry?.toString(),
        error: request.error ? this.ErrorMetadataToRecord(request.error) : undefined,
      },
      { removeUndefinedValues: true },
    );
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

  async saveFlowDeleteRequest(flowDeleteRequest: FlowDeleteRequest): Promise<void> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.config.flowDeleteRequestsTableName,
        ReturnValues: "NONE",
        Item: this.flowDeleteRequestToRecord(flowDeleteRequest),
      }),
    );
  }
}
