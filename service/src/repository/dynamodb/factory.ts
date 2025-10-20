import { log } from '@tams-k8s/logger';
import {
    CreateTableCommand,
    DescribeTableCommand,
    DynamoDBClient,
    ResourceNotFoundException
} from '@aws-sdk/client-dynamodb';

import type { DynamoDBConfig } from '../../configParser';
import  { Factory } from "../factory";
import  { FlowRepository } from "../flows";
import { ServiceRepository } from "../service";
import { DDBFlowsImpl } from "./flows";
import { DDBServiceImpl } from "./service";
import { SourceRepository } from 'repository/source';
import { DDBSourcesImpl } from './source';

export class DDBRepositoryFactory implements Factory {
    private readonly config: DynamoDBConfig;
    private readonly client;

    constructor(config: DynamoDBConfig) {
        this.config = config;
        this.client = new DynamoDBClient({
            region: config.region,
            endpoint: config.endpoint
        });
    }

    private async createFlowTable() {
        await this.client.send(new CreateTableCommand({
            TableName: this.config.flowTableName,
            AttributeDefinitions: [{
                AttributeName: 'flowId',
                AttributeType: 'S'
            }],
            KeySchema: [{
                AttributeName: 'flowId',
                KeyType: 'HASH'
            }],
            BillingMode: 'PAY_PER_REQUEST'
        }))
    }

    private async createServiceTable() {
        await this.client.send(new CreateTableCommand({
            TableName: this.config.serviceTableName,
            AttributeDefinitions: [{
                AttributeName: 'serviceKey',
                AttributeType: 'S'
            }],
            KeySchema: [{
                AttributeName: 'serviceKey',
                KeyType: 'HASH'
            }],
            BillingMode: 'PAY_PER_REQUEST'
        }))
    }

    private async createSourceTable() {
        await this.client.send(new CreateTableCommand({
            TableName: this.config.sourceTableName,
            AttributeDefinitions: [{
                AttributeName: "id",
                AttributeType: "S",
            }],
            KeySchema: [{
                AttributeName: "id",
                KeyType: "HASH",
            }],
            BillingMode: "PAY_PER_REQUEST",
        }));
    }

    async initialize() {
        // ensure service table exists
        try {
            await this.client.send(new DescribeTableCommand({
                TableName: this.config.serviceTableName,
            }));
        } catch (e) {
            if (e instanceof ResourceNotFoundException) {
                log.info('Service table not found, creating...', { tableName: this.config.serviceTableName });
                await this.createServiceTable();
                log.info('Service table created', { tableName: this.config.serviceTableName });
            } else {
                log.error('Could not verify service table existence', { tableName: this.config.serviceTableName }, e);
            }
        }
        // ensure flow table exists
        try {
            await this.client.send(new DescribeTableCommand({
                TableName: this.config.flowTableName,
            }));
        } catch (e) {
            if (e instanceof ResourceNotFoundException) {
                log.info('Flow table not found, creating...', { tableName: this.config.flowTableName });
                await this.createFlowTable();
                log.info('Flow table created', { tableName: this.config.flowTableName });
            } else {
                log.error('Could not verify flow table existence', { tableName: this.config.flowTableName }, e);
                throw e;
            }
        }
        // Ensure source table exists
        try {
            await this.client.send(new DescribeTableCommand({
                TableName: this.config.sourceTableName,
            }));
        } catch (e) {
            if (e instanceof ResourceNotFoundException) {
              log.info("Source table not found, creating...", {
                tableName: this.config.sourceTableName,
              });
              await this.createFlowTable();
              log.info("Source table created", {
                tableName: this.config.sourceTableName,
              });
            } else {
              log.error(
                "Could not verify source table existence",
                { tableName: this.config.sourceTableName }, e);
              throw e;
            }
        }
    }

    getFlowRepository(): FlowRepository {
        return new DDBFlowsImpl(this.client, this.config);
    };

    getServiceRepository(): ServiceRepository {
        return new DDBServiceImpl(this.client, this.config);
    }

    getSourceRepository(): SourceRepository {
        return new DDBSourcesImpl(this.client, this.config);
    }
}
