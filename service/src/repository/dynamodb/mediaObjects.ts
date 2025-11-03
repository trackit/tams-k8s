import { AttributeValue, DynamoDBClient, GetItemCommand, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';
import { DynamoDBConfig } from '../../configParser';
import { MediaObject, MediaObjectsRepository } from '../mediaObjects';

export class DDBMediaObjectsImpl implements MediaObjectsRepository {
    private readonly client: DynamoDBClient;
    private readonly config: DynamoDBConfig;

    constructor(client: DynamoDBClient, config: DynamoDBConfig) {
        this.client = client;
        this.config = config;
    }

    private mediaObjectToRecord(data: MediaObject): Record<string, AttributeValue> {
        return marshall({
            ...data,
            expiresAt: data.expiresAt?.toString(),
        }, { removeUndefinedValues: true })
    }

    private recordToMediaObject(record: Record<string, AttributeValue>): MediaObject {
        const data = unmarshall(record);
        return {
            objectId: data.objectId,
            flowId: data.flowId,
            storageId: data.storageId,
            expiresAt: new Date(data.expiresAt),
        }
    }

    async getMediaObjectById(id: string): Promise<MediaObject | null> {
        const resp = await this.client.send(new GetItemCommand({
            TableName: this.config.mediaObjectTableName,
            Key: {
                objectId: {
                    S: id
                }
            }
        }));
        if (resp.Item === undefined) return null;
        return this.recordToMediaObject(resp.Item);
    }

    async putMediaObject(mediaObject: MediaObject): Promise<MediaObject> {
        await this.client.send(new PutItemCommand({
            TableName: this.config.mediaObjectTableName,
            ReturnValues: 'NONE',
            Item: this.mediaObjectToRecord(mediaObject)
        }));
        return mediaObject;
    }
}
