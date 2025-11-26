import {
  SourceRepository,
  FlowDeleteRequestsRepository,
  FlowRepository,
  MediaObjectsRepository,
  ServiceRepository,
} from "../index";
import {
  MemoryFlowsRepository,
  MemoryMediaObjectRepository,
  MemoryServiceRepository,
  MemoryFlowDeleteRequestsRepository,
  MemorySourceRepository,
} from "./index";
import { type Factory } from "../factory";

export class MemoryRepositoryFactory implements Factory {
  private readonly flowRepo: MemoryFlowsRepository;
  private readonly serviceRepo: MemoryServiceRepository;
  private readonly sourceRepo: MemorySourceRepository;
  private readonly mediaObjectRepository: MemoryMediaObjectRepository;
  private readonly flowDeleteRequestsRepo: MemoryFlowDeleteRequestsRepository;

  constructor() {
    this.flowRepo = new MemoryFlowsRepository();
    this.serviceRepo = new MemoryServiceRepository();
    this.sourceRepo = new MemorySourceRepository();
    this.mediaObjectRepository = new MemoryMediaObjectRepository();
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
