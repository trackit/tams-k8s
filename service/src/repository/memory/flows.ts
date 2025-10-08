import { FormatUrn } from '@tams-k8s/api';
import Joi from 'joi';
import { InvalidPageTokenError } from '../errors';
import type { Flow, FlowRepository, ListFlowsFilters, ListFlowsResponse } from '../flows';

export class MemoryFlowsImpl implements FlowRepository {
    private readonly flows: Flow[];

    constructor() {
        this.flows = [];
    }

    private encodePageToken(flowId: string) {
        return Buffer.from(flowId, 'utf8').toString('base64url');
    }

    private decodePageToken(pageToken: string) {
        try {
            const decoded = Buffer.from(pageToken, 'base64url').toString('utf8');
            Joi.assert(decoded, Joi.string().uuid().required());
            return decoded;
        } catch (e) {
            throw new InvalidPageTokenError();
        }
    }

    // TODO(arthur): implement timerange filtering
    async listFlows(filters?: ListFlowsFilters): Promise<ListFlowsResponse> {
        let filteredFlows = this.flows;
        if (filters?.sourceId) {
            filteredFlows = filteredFlows.filter(({ sourceId }) => sourceId === filters.sourceId);
        }
        if (filters?.flowFormat) {
            filteredFlows = filteredFlows.filter(({ format }) => format === filters.flowFormat);
        }
        if (filters?.codec) {
            filteredFlows = filteredFlows.filter(({ codec }) => codec === filters.codec);
        }
        if (filters?.label) {
            filteredFlows = filteredFlows.filter(({ label }) => label === filters.label);
        }
        if (filters?.frameWidth) {
            filteredFlows = filteredFlows.filter((flow) => {
                if (flow.format === FormatUrn.VIDEO || flow.format === FormatUrn.IMAGE) {
                    return flow.essenceParameters.frameWidth === filters.frameWidth;
                }
                return false
            });
        }
        if (filters?.frameHeight) {
            filteredFlows = filteredFlows.filter((flow) => {
                if (flow.format === FormatUrn.VIDEO || flow.format === FormatUrn.IMAGE) {
                    return flow.essenceParameters.frameHeight === filters.frameHeight;
                }
                return false
            });
        }
        if (filters?.tags) {
            Object.entries(filters.tags).forEach(([key, value]) => {
                filteredFlows = filteredFlows.filter(({ tags }) => tags?.[key] === value);
            });
        }
        if (filters?.haveTags) {
            filters.haveTags.forEach(key => {
                filteredFlows = filteredFlows.filter(({ tags }) => tags?.[key] !== undefined);
            });
        }
        if (filters?.doesNotHaveTags) {
            filters.doesNotHaveTags.forEach(key => {
                filteredFlows = filteredFlows.filter(({ tags }) => tags?.[key] === undefined);
            });
        }
        if (filters?.pageToken) {
            const decoded = this.decodePageToken(filters.pageToken);
            const index = filteredFlows.findIndex(({ flowId }) => flowId === decoded);
            if (index === -1) {
                throw new InvalidPageTokenError();
            }
            filteredFlows = filteredFlows.slice(index + 1);
        }
        if (filters?.limit) {
            filteredFlows = filteredFlows.slice(0, filters.limit);
        }
        return {
            flows: filteredFlows,
            limit: filters?.limit,
            nextPageToken: filteredFlows.length && filteredFlows.length === filters?.limit ? this.encodePageToken(filteredFlows[filteredFlows.length - 1].flowId) : undefined,
        };
    }

    async getFlowById(flowId: string): Promise<Flow | null> {
        return this.flows.find(({ flowId: findFlowId }) => findFlowId === flowId) ?? null;
    }

    async putFlow(flow: Flow): Promise<Flow> {
        const indexToUpdate = this.flows.findIndex(({ flowId: findFlowId }) => findFlowId === flow.flowId);
        if (indexToUpdate === -1) {
            this.flows.push(flow);
        } else {
            this.flows[indexToUpdate] = flow;
        }
        return flow;
    }
}
