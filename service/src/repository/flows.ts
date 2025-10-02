export interface Flow {
    flowId: string;
    sourceId: string;
    label?: string;
    description?: string;
    createdBy: string;
    updatedBy: string;
    tags: Record<string, string>;
}

export abstract class FlowRepository {
    listFlows(): Promise<Flow[]> {
        throw new Error("Not implemented");
    };
}
