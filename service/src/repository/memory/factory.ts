import { SourceRepository } from "repository/source";
import  { type Factory } from "../factory";
import  { FlowRepository } from "../flows";
import { MediaObjectsRepository } from '../mediaObjects';
import { ServiceRepository } from "../service";
import { MemoryFlowsImpl } from "./flows";
import { MemoryMediaObjectImpl } from './mediaObject';
import { MemoryServiceImpl } from "./service";
import { MemorySourceImpl } from "./source";

export class MemoryRepositoryFactory implements Factory {
    private readonly flowRepo: MemoryFlowsImpl;
    private readonly serviceRepo: MemoryServiceImpl;
    private readonly sourceRepo: MemorySourceImpl;
    private readonly mediaObjectRepository: MediaObjectsRepository;

    constructor() {
        this.flowRepo = new MemoryFlowsImpl();
        this.serviceRepo = new MemoryServiceImpl();
        this.sourceRepo = new MemorySourceImpl();
        this.mediaObjectRepository = new MemoryMediaObjectImpl();
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
    
    getMediaObjectRepository(): MediaObjectsRepository {
        return this.mediaObjectRepository;
    }
}
