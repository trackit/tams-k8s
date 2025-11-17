import { FlowDeleteRequest } from "@tams-k8s/api";
import {createInjectionToken, register} from "../di";
import { DDBFlowDeleteRequestsImpl } from "./dynamodb/flowDeleteRequests";

export interface FlowDeleteRequestsRepository {
  listFlowDeleteRequest(): Promise<FlowDeleteRequest[]>;
  getFlowDeleteRequestById(flowDeleteRequestId: string): Promise<FlowDeleteRequest | null>;
  saveFlowDeleteRequest(flowDeleteRequest: FlowDeleteRequest): Promise<void>;
}

export const flowDeleteRequestsRepositoryToken = createInjectionToken<FlowDeleteRequestsRepository>('FlowDeleteRequestsRepository')

// readFile

if (file.prod) {
  register(flowDeleteRequestsRepositoryToken, {
    useClass: DDBFlowDeleteRequestsImpl
  })
}
