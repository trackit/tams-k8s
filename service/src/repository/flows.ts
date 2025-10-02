export interface ListFlowsFilters {
    sourceId?: string;
    timerange?: string;
    flowFormat?: string;
    codec?: string;
    label?: string;
    frameWidth?: number;
    frameHeight?: number;
    tags?: Record<string, string>;
    haveTags?: string[];
    doesNotHaveTags?: string[];
}

export interface VideoFlow {
    id: string;
    sourceId: string;
    label: string;
    description?: string;
    createdBy: string;
    updatedBy: string;
    tags: Record<string, string>;
}

export type Flow = VideoFlow;

export interface FlowRepository {
    listFlows(filters?: ListFlowsFilters): Promise<Flow[]>;
}
