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
import { MediaObjectsRepository } from '../mediaObjects';
import { ServiceRepository } from "../service";
import { FlowDeleteRequestsRepository } from '../flowDeleteRequests';
import { DDBFlowsImpl } from "./flows";
import { DDBMediaObjectsImpl } from './mediaObjects';
import { DDBServiceImpl } from "./service";
import { DDBFlowDeleteRequestsRepository } from "./flowDeleteRequests";
import { SourceRepository } from 'repository/source';
import { DDBSourcesRepository } from './source';

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
        }));}

    private async createMediaObjectTable() {
        await this.client.send(new CreateTableCommand({
            TableName: this.config.mediaObjectTableName,
            AttributeDefinitions: [{
                AttributeName: 'objectId',
                AttributeType: 'S'
            }],
            KeySchema: [{
                AttributeName: 'objectId',
                KeyType: 'HASH'
            }],
            BillingMode: 'PAY_PER_REQUEST'
        }))
    }

    // TODO: remove and use func from repo
    private async createFlowDeleteRequestsTable() {
        await this.client.send(new CreateTableCommand({
            TableName: this.config.flowDeleteRequestsTableName,
            AttributeDefinitions: [{
                AttributeName: 'id',
                AttributeType: 'S'
            }],
            KeySchema: [{
                AttributeName: 'id',
                KeyType: 'HASH'
            }],
            BillingMode: 'PAY_PER_REQUEST'
        }))
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
              await this.createSourceTable();
              log.info("Source table created", {
                tableName: this.config.sourceTableName,
              });
            } else {
              log.error(
                "Could not verify source table existence",
                { tableName: this.config.sourceTableName }, e);
            }
        }

        // ensure media object exists
        try {
            await this.client.send(new DescribeTableCommand({
                TableName: this.config.mediaObjectTableName,
            }));
        } catch (e) {
            if (e instanceof ResourceNotFoundException) {
                log.info('Media object table not found, creating...', { tableName: this.config.mediaObjectTableName });
                await this.createMediaObjectTable();
                log.info('Media object table created', { tableName: this.config.mediaObjectTableName });
            } else {
                log.error('Could not verify media object table existence', { tableName: this.config.mediaObjectTableName });
            }
        }
        
        // ensure flow-delete-requests exists
        try {
            await this.client.send(new DescribeTableCommand({
                TableName: this.config.flowDeleteRequestsTableName,
            }));
        } catch (e) {
            if (e instanceof ResourceNotFoundException) {
                log.info("Flow-delete-requests table not found, creating...", {
                  tableName: this.config.flowDeleteRequestsTableName,
                });
                await this.createFlowDeleteRequestsTable();
                log.info("Flow-delete-requests table created", {
                  tableName: this.config.flowDeleteRequestsTableName,
                });
            } else {
                log.error("Could not verify flow-delete-requests table existence", {
                  tableName: this.config.flowDeleteRequestsTableName,
                });
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
        return new DDBSourcesRepository();
    }

    getMediaObjectRepository(): MediaObjectsRepository {
        return new DDBMediaObjectsImpl(this.client, this.config);
    }

    getFlowDeleteRequestsRepository(): FlowDeleteRequestsRepository {
        return new DDBFlowDeleteRequestsRepository();
    }
}
