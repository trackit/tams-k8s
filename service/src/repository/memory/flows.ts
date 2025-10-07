import type { Flow, FlowRepository } from "../flows";

export class MemoryFlowsImpl implements FlowRepository {
    private readonly flows: Flow[];

    constructor() {
        this.flows = [];
    }

    async listFlows() {
        return this.flows;
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
