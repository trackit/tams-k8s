import {
  SourceRepository,
  FlowDeleteRequestsRepository,
  FlowRepository,
  MediaObjectsRepository,
  ServiceRepository,
} from "../index";
import {
  MemoryFlowsImpl,
  MemoryMediaObjectImpl,
  MemoryServiceRepository,
  MemoryFlowDeleteRequestsRepository,
  MemorySourceRepository,
} from "./index";
import { type Factory } from "../factory";

export class MemoryRepositoryFactory implements Factory {
  private readonly flowRepo: MemoryFlowsImpl;
  private readonly serviceRepo: MemoryServiceRepository;
  private readonly sourceRepo: MemorySourceRepository;
  private readonly mediaObjectRepository: MediaObjectsRepository;
  private readonly flowDeleteRequestsRepo: MemoryFlowDeleteRequestsRepository;

  constructor() {
    this.flowRepo = new MemoryFlowsImpl();
    this.serviceRepo = new MemoryServiceRepository();
    this.sourceRepo = new MemorySourceRepository();
    this.mediaObjectRepository = new MemoryMediaObjectImpl();
    this.flowDeleteRequestsRepo = new MemoryFlowDeleteRequestsRepository();
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

  getFlowDeleteRequestsRepository(): FlowDeleteRequestsRepository {
    return this.flowDeleteRequestsRepo;
  }
}
