import { FlowDeleteRequest } from "@tams-k8s/api";
import { createInjectionToken } from "../di";

export interface FlowDeleteRequestsRepository {
  listFlowDeleteRequest(): Promise<FlowDeleteRequest[]>;
  getFlowDeleteRequestById(
    flowDeleteRequestId: string
  ): Promise<FlowDeleteRequest | null>;
  saveFlowDeleteRequest(flowDeleteRequest: FlowDeleteRequest): Promise<void>;
  deleteFlowDeleteRequest(requestId: string): Promise<boolean>;
}

export const flowDeleteRequestsRepositoryToken =
  createInjectionToken<FlowDeleteRequestsRepository>(
    "FlowDeleteRequestsRepository"
  );
