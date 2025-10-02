import type { Flow, FlowRepository } from "../flows";

export class MemoryFlowsImpl implements FlowRepository {
    private readonly flows: Flow[];

    constructor() {
        this.flows = [];
    }

    listFlows() {
        return Promise.resolve(this.flows);
    }
}
