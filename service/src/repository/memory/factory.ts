import  { type Factory } from "../factory";
import  { FlowRepository } from "../flows";
import { MediaObjectsRepository } from '../mediaObjects';
import { ServiceRepository } from "../service";
import { MemoryFlowsImpl } from "./flows";
import { MemoryMediaObjectImpl } from './mediaObject';
import { MemoryServiceImpl } from "./service";

export class MemoryRepositoryFactory implements Factory {
    private readonly flowRepo: MemoryFlowsImpl;
    private readonly serviceRepo: MemoryServiceImpl;
    private readonly mediaObjectRepository: MediaObjectsRepository;

    constructor() {
        this.flowRepo = new MemoryFlowsImpl();
        this.serviceRepo = new MemoryServiceImpl();
        this.mediaObjectRepository = new MemoryMediaObjectImpl();
    }

    async initialize() {}

    getFlowRepository(): FlowRepository {
        return this.flowRepo;
    }

    getServiceRepository(): ServiceRepository {
        return this.serviceRepo;
    }

    getMediaObjectRepository(): MediaObjectsRepository {
        return this.mediaObjectRepository;
    }
}
