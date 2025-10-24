import type { FlowRepository } from "./flows";
import { MediaObjectsRepository } from './mediaObjects';
import { ServiceRepository } from "./service";

export interface Factory {
    initialize(): Promise<void>;
    getFlowRepository(): FlowRepository;
    getServiceRepository(): ServiceRepository;
    getMediaObjectRepository(): MediaObjectsRepository;
}
