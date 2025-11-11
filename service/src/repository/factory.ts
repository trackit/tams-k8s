import type { FlowRepository } from "./flows";
import { MediaObjectsRepository } from './mediaObjects';
import { ServiceRepository } from "./service";
import { SourceRepository } from "./source";

export interface Factory {
    initialize(): Promise<void>;
    getFlowRepository(): FlowRepository;
    getServiceRepository(): ServiceRepository;
    getMediaObjectRepository(): MediaObjectsRepository;
    getSourceRepository(): SourceRepository;
}
