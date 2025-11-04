import  { type Factory } from "../factory";
import  { FlowRepository } from "../flows";
import { MediaObjectsRepository } from '../mediaObjects';
import { ServiceRepository } from "../service";
import { FlowDeleteRequestsRepository } from "../flowDeleteRequests";
import { MemoryFlowsImpl } from "./flows";
import { MemoryMediaObjectImpl } from './mediaObject';
import { MemoryServiceImpl } from "./service";
import { MemoryFlowDeleteRequestsImpl } from "./flowDeleteRequests";

export class MemoryRepositoryFactory implements Factory {
    private readonly flowRepo: MemoryFlowsImpl;
    private readonly serviceRepo: MemoryServiceImpl;
    private readonly mediaObjectRepository: MediaObjectsRepository;
    private readonly flowDeleteRequestsRepo: MemoryFlowDeleteRequestsImpl;

    constructor() {
        this.flowRepo = new MemoryFlowsImpl();
        this.serviceRepo = new MemoryServiceImpl();
        this.mediaObjectRepository = new MemoryMediaObjectImpl();
        this.flowDeleteRequestsRepo = new MemoryFlowDeleteRequestsImpl();
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

    getFlowDeleteRequestsRepository(): FlowDeleteRequestsRepository {
        return this.flowDeleteRequestsRepo;
    }
}
