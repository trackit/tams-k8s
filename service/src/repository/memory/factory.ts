import  { type Factory } from "../factory";
import  { FlowRepository } from "../flows";
import { ServiceRepository } from "../service";
import { MemoryFlowsImpl } from "./flows";
import { MemoryServiceImpl } from "./service";

export class MemoryRepositoryFactory implements Factory {
    private readonly flowRepo: MemoryFlowsImpl;
    private readonly serviceRepo: MemoryServiceImpl;

    constructor() {
        this.flowRepo = new MemoryFlowsImpl();
        this.serviceRepo = new MemoryServiceImpl();
    }

    async initialize() {}

    getFlowRepository(): FlowRepository {
        return this.flowRepo;
    }

    getServiceRepository(): ServiceRepository {
        return this.serviceRepo;
    }
}
