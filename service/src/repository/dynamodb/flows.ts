import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBConfig } from "../../config";
import type { FlowRepository } from "../flows.js";

export class DDBFlowsImpl implements FlowRepository {
    private readonly client: DynamoDBClient;
    private readonly config: DynamoDBConfig;

    constructor(client: DynamoDBClient, config: DynamoDBConfig) {
        this.client = client;
        this.config = config;
    }

    listFlows() {
        return Promise.resolve([]);
    }
}
