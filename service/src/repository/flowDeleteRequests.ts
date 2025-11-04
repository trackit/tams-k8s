import { FlowDeleteRequestStatus } from "@tams-k8s/api";

export interface FlowDeleteRequest {
  id: string;
  flowId?: string;
  timerange: string;
  status: FlowDeleteRequestStatus;
  progress?: number;
  created?: string | Date;
  updated?: string | Date;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

export interface FlowDeleteRequestsRepository {
  listFlowDeleteRequest(): Promise<FlowDeleteRequest[]>;
  getFlowDeleteRequestById(flowDeleteRequestId: string): Promise<FlowDeleteRequest | null>;
}
