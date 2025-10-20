import type { FlowRepository } from "./flows";
import { ServiceRepository } from "./service";
import { SourceRepository } from "./source";

export abstract class Factory {
    async initialize() {};

    getFlowRepository(): FlowRepository {
        throw new Error("Not implemented");
    };

    getSourceRepository(): SourceRepository{
      throw new Error("Not implemented");
    }

    getServiceRepository(): ServiceRepository {
        throw new Error("Not implemented");
    }
}
