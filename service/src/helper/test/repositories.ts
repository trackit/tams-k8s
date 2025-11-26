import { Factory } from '../../repository/factory';
import { Flow, FlowRepository } from '../../repository/flows';
import { MediaObject, MediaObjectsRepository } from '../../repository/mediaObjects';
import { MemoryFlowsImpl } from '../../repository/memory/flows';
import { MemoryMediaObjectImpl } from '../../repository/memory/mediaObject';
import { MemoryServiceImpl } from '../../repository/memory/service';
import { MemorySourceImpl } from '../../repository/memory/source';
import { Service, ServiceRepository } from '../../repository/service';
import { Source, SourceRepository } from '../../repository/source';

export class TestRepositories implements Factory {
    private flows: Flow[] | undefined;
    private sources: Source[] | undefined;
    private service: Service | undefined;
    private mediaObjects: MediaObject[] | undefined;

    private flowRepository: MemoryFlowsImpl | undefined;
    private mediaObjectRepository: MemoryMediaObjectImpl | undefined;
    private serviceRepository: MemoryServiceImpl | undefined;
    private sourceRepository: MemorySourceImpl | undefined;

    async initialize(): Promise<void> {
        return;
    }

    withFlows(flows: Flow[]) {
        this.flows = flows;
        return this;
    }

    withSources(sources: Source[]) {
        this.sources = sources;
        return this;
    }

    withService(service: Service) {
        this.service = service;
        return this;
    }

    withMediaObjects(mediaObjects: MediaObject[]) {
        this.mediaObjects = mediaObjects;
        return this;
    }

    getInternalFlows(): Flow[] {
        return this.flowRepository?.getInternal() ?? [];
    }

    getInternalSources(): Source[] {
        return this.sourceRepository?.getInternal() ?? [];
    }

    getInternalService(): Service {
        return this.serviceRepository?.getInternal() ?? {
            name: '',
            description: ''
        };
    }

    getMediaObjects(): MediaObject[] {
        return this.mediaObjectRepository?.getInternal() ?? [];
    }

    getFlowRepository(): FlowRepository {
        return this.flowRepository ?? (this.flowRepository = new MemoryFlowsImpl(this.flows));
    }

    getMediaObjectRepository(): MediaObjectsRepository {
        return this.mediaObjectRepository ?? (this.mediaObjectRepository ?? new MemoryMediaObjectImpl(this.mediaObjects));
    }

    getServiceRepository(): ServiceRepository {
        return this.serviceRepository ?? (this.serviceRepository = new MemoryServiceImpl(this.service));
    }

    getSourceRepository(): SourceRepository {
        return this.sourceRepository ?? (this.sourceRepository = new MemorySourceImpl(this.sources));
    }
}
