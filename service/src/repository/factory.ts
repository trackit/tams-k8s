import type { FlowRepository } from "./flows";
import { ServiceRepository } from "./service";

export abstract class Factory {
    async initialize() {};

    getFlowRepository(): FlowRepository {
        throw new Error("Not implemented");
    };

    getServiceRepository(): ServiceRepository {
        throw new Error("Not implemented");
    }
}
