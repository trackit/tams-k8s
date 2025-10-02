import { DynamoDBClient, GetItemCommand, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { marshall, unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBConfig } from "../../config";
import { Service, ServiceRepository, ServiceUpdate } from "../service";

export class DDBServiceImpl implements ServiceRepository {
    private readonly client: DynamoDBClient;
    private readonly config: DynamoDBConfig;

    constructor(client: DynamoDBClient, config: DynamoDBConfig) {
        this.client = client;
        this.config = config;
    }

    async getService(): Promise<Service> {
        const resp = await this.client.send(new GetItemCommand({
            TableName: this.config.serviceTableName,
            Key: {
                serviceKey: {
                    S: 'service'
                }
            }
        }));
        if (!resp.Item) {
            return {
                name: '',
                description: ''
            }
        }
        const data = unmarshall(resp.Item);
        return {
            name: data.name,
            description: data.description,
        };
    }

    async updateService(next: ServiceUpdate): Promise<void> {
        const resp = await this.client.send(new PutItemCommand({
            TableName: this.config.serviceTableName,
            Item: marshall({
                serviceKey: 'service',
                name: next.name,
                description: next.description ?? ''
            })
        }))
    }
}
