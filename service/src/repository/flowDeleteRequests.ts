import { FlowDeleteRequest } from "@tams-k8s/api";

export interface FlowDeleteRequestsRepository {
  listFlowDeleteRequest(): Promise<FlowDeleteRequest[]>;
  getFlowDeleteRequestById(flowDeleteRequestId: string): Promise<FlowDeleteRequest | null>;
  saveFlowDeleteRequest(flowDeleteRequest: FlowDeleteRequest): Promise<void>;
}
