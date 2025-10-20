import { SourceRepository } from "repository/source";
import  { type Factory } from "../factory";
import  { FlowRepository } from "../flows";
import { ServiceRepository } from "../service";
import { MemoryFlowsImpl } from "./flows";
import { MemoryServiceImpl } from "./service";
import { MemorySourceImpl } from "./source";

export class MemoryRepositoryFactory implements Factory {
    private readonly flowRepo: MemoryFlowsImpl;
    private readonly serviceRepo: MemoryServiceImpl;
    private readonly sourceRepo: MemorySourceImpl;

    constructor() {
        this.flowRepo = new MemoryFlowsImpl();
        this.serviceRepo = new MemoryServiceImpl();
        this.sourceRepo = new MemorySourceImpl();
    }

    async initialize() {}

    getFlowRepository(): FlowRepository {
        return this.flowRepo;
    }

    getServiceRepository(): ServiceRepository {
        return this.serviceRepo;
    }

    getSourceRepository(): SourceRepository {
        return this.sourceRepo;
    }
}
