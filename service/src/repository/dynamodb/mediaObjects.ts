import {
  AttributeValue,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
} from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { MediaObject, MediaObjectsRepository } from "../mediaObjects";
import { createInjectionToken, inject } from "../../di";
import { dynamodbClientToken, dynamodbConfigToken } from "./client";

export const MediaObjectTableNameToken = createInjectionToken<string>(
  "MediaObjectTableName",
  {
    useFactory: () => inject(dynamodbConfigToken).mediaObjectTableName,
  }
);

export class DDBMediaObjectsRepository implements MediaObjectsRepository {
  private readonly client: DynamoDBClient = inject(dynamodbClientToken);
  private readonly tableName = inject(MediaObjectTableNameToken);

  private mediaObjectToRecord(
    data: MediaObject
  ): Record<string, AttributeValue> {
    return marshall(
      {
        ...data,
        expiresAt: data.expiresAt?.toString(),
      },
      { removeUndefinedValues: true }
    );
  }

  private recordToMediaObject(
    record: Record<string, AttributeValue>
  ): MediaObject {
    const data = unmarshall(record);
    return {
      objectId: data.objectId,
      flowId: data.flowId,
      storageId: data.storageId,
      expiresAt: new Date(data.expiresAt),
    };
  }

  async getMediaObjectById(id: string): Promise<MediaObject | null> {
    const resp = await this.client.send(
      new GetItemCommand({
        TableName: this.tableName,
        Key: {
          objectId: {
            S: id,
          },
        },
      })
    );
    if (resp.Item === undefined) return null;
    return this.recordToMediaObject(resp.Item);
  }

  async putMediaObject(mediaObject: MediaObject): Promise<MediaObject> {
    await this.client.send(
      new PutItemCommand({
        TableName: this.tableName,
        ReturnValues: "NONE",
        Item: this.mediaObjectToRecord(mediaObject),
      })
    );
    return mediaObject;
  }
}
