import { FormatUrn } from '@tams-k8s/api';
import Joi from 'joi';
import { InvalidPageTokenError } from '../errors';
import type { Flow, FlowRepository, ListFlowsFilters, ListFlowsResponse } from '../flows';

export class MemoryFlowsImpl implements FlowRepository {
    private readonly flows: Flow[];

    constructor() {
        // this.flows = [];
        this.flows = [
            {
                flowId: "1bb30e78-3901-4e70-9960-915951d5289e",
                sourceId: "b4b6b65d-9903-4a01-9ba7-0543bc8a10aa",
                label: "test2",
                tags: {
                    tag1: "value1"
                },
                created: "2025-10-08T09:25:25.000Z",
                metadataUpdated: "2025-10-08T09:25:25.000Z",
                codec: "video/mp4",
                format: FormatUrn.AUDIO,
                essenceParameters: {
                    sampleRate: 48000,
                    channels: 2
                }
            },
            {
                flowId: "1bb30e78-3901-4e70-9960-915951d5289b",
                sourceId: "b4b6b65d-9903-4a01-9ba7-0543bc8a10aa",
                label: "test2",
                tags: {
                    tag2: "value1"
                },
                created: "2025-10-08T09:25:00.000Z",
                metadataUpdated: "2025-10-08T09:25:00.000Z",
                codec: "video/mp4",
                format: FormatUrn.AUDIO,
                essenceParameters: {
                    sampleRate: 48000,
                    channels: 2
                }
            },
            {
                flowId: "1bb30e78-3901-4e70-9960-915951d5289c",
                sourceId: "b4b6b65d-9903-4a01-9ba7-0543bc8a10aa",
                label: "this-is-the-label",
                description: "This is a test description",
                tags: {
                    tag3: "value1"
                },
                created: "2025-10-06T15:56:24.000Z",
                metadataUpdated: "2025-10-08T08:58:29.000Z",
                codec: "video/mp4",
                avgBitRate: 4000,
                maxBitRate: 5000,
                flowCollection: [
                    {
                        id: "ae332530-66b0-41bc-be5f-cfc0319e5671",
                        role: "role",
                        containerMapping: {
                            trackIndex: 0,
                            mxfContainer: {
                                trackId: 2
                            }
                        }
                    }
                ],
                format: FormatUrn.AUDIO,
                essenceParameters: {
                    sampleRate: 48000,
                    channels: 2
                }
            },
            {
                flowId: "1bb30e78-3901-4e70-9960-915951d5289d",
                sourceId: "b4b6b65d-9903-4a01-9ba7-0543bc8a10aa",
                label: "test2",
                tags: {
                    tag4: "value1"
                },
                created: "2025-10-08T09:25:19.000Z",
                metadataUpdated: "2025-10-08T09:25:19.000Z",
                codec: "video/mp4",
                format: FormatUrn.AUDIO,
                essenceParameters: {
                    sampleRate: 48000,
                    channels: 2
                }
            },
            {
                flowId: "1bb30e78-3901-4e70-9960-915951d5289a",
                sourceId: "b4b6b65d-9903-4a01-9ba7-0543bc8a10aa",
                label: "test2",
                tags: {
                    tag4: "value1"
                },
                created: "2025-10-08T09:24:53.000Z",
                metadataUpdated: "2025-10-08T09:24:53.000Z",
                codec: "video/mp4",
                format: FormatUrn.AUDIO,
                essenceParameters: {
                    sampleRate: 48000,
                    channels: 2
                }
            },
            {
                flowId: "1bb30e78-3901-4e70-9960-915951d5289f",
                sourceId: "b4b6b65d-9903-4a01-9ba7-0543bc8a10aa",
                label: "test2",
                tags: {
                    tag5: "value1"
                },
                created: "2025-10-08T09:25:32.000Z",
                metadataUpdated: "2025-10-08T09:25:32.000Z",
                codec: "video/mp4",
                format: FormatUrn.AUDIO,
                essenceParameters: {
                    sampleRate: 48000,
                    channels: 2
                }
            }
        ];
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
            const index = this.flows.findIndex(({ flowId }) => flowId === decoded);
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
