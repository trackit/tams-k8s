import { AttributeValue, DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";
import { unmarshall } from "@aws-sdk/util-dynamodb";
import { DynamoDBConfig } from "../../config";
import type { Flow, FlowRepository, ListFlowsFilters } from "../flows.js";

export class DDBFlowsImpl implements FlowRepository {
    private readonly client: DynamoDBClient;
    private readonly config: DynamoDBConfig;

    constructor(client: DynamoDBClient, config: DynamoDBConfig) {
        this.client = client;
        this.config = config;
    }

    private recordToFlow(record: Record<string, AttributeValue>): Flow {
        const data = unmarshall(record);
        return {
            id: data.id,
            description: data.description,
            createdBy: data.createdBy,
            updatedBy: data.updatedBy,
            label: data.label,
            sourceId: data.sourceId,
            tags: data.tags,
        }
    }

    private recordsToFlow(records: Record<string, AttributeValue>[]) {
        return records.map(this.recordToFlow);
    }

    async listFlows(filters?: ListFlowsFilters) {
        let filterExpr: string[] = [];
        const exprAttrVal: Record<string, AttributeValue> = {};
        const exprAttrNames: Record<string, string> = {};
        let nameInc = 0;
        if (filters?.sourceId) {
            filterExpr.push('sourceId = :sourceId');
            exprAttrVal[':sourceId'] = { S: filters.sourceId };
        }
        if (filters?.flowFormat) {
            filterExpr.push('flowFormat = :format');
            exprAttrVal[':format'] = { S: filters.flowFormat };
        }
        if (filters?.codec) {
            filterExpr.push('codec = :codec');
            exprAttrVal[':codec'] = { S: filters.codec };
        }
        if (filters?.label) {
            filterExpr.push('label = :label');
            exprAttrVal[':label'] = { S: filters.label };
        }
        if (filters?.frameWidth) {
            filterExpr.push('frameWidth = :frameWidth');
            exprAttrVal[':frameWidth'] = { N: filters.frameWidth.toString() };
        }
        if (filters?.frameHeight) {
            filterExpr.push('frameHeight = :frameHeight');
            exprAttrVal[':frameHeight'] = { N: filters.frameHeight.toString() };
        }
        Object.entries(filters?.tags ?? {}).forEach(([key, value]) => {
            const keyName = `#key${nameInc++}`;
            filterExpr.push(`tags.${keyName} = :tag_${key}`);
            exprAttrVal[`:tag_${key}`] = { S: value };
            exprAttrNames[keyName] = key;
        });
        filters?.haveTags?.forEach(key => {
            const keyName = `#key${nameInc++}`;
            filterExpr.push(`attribute_exists(tags.${keyName})`);
            exprAttrNames[keyName] = key;
        });
        filters?.doesNotHaveTags?.forEach(key => {
            const keyName = `#key${nameInc++}`;
            filterExpr.push(`attribute_not_exists(tags.${keyName})`);
            exprAttrNames[keyName] = key;
        });
        const resp = await this.client.send(new ScanCommand({
            TableName: this.config.flowTtableName,
            FilterExpression: filterExpr.length === 0 ? undefined : filterExpr.join(' AND '),
            ExpressionAttributeNames: exprAttrNames,
            ExpressionAttributeValues: exprAttrVal
        }))
        if (!resp.Items) return [];
        return this.recordsToFlow(resp.Items);
    }
}
