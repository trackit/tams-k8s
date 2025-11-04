export enum FlowDeleteRequestStatus {
  PENDING = "pending",
  RUNNING = "running",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface FlowDeleteRequest {
  id: string;
  flow_id?: string;
  timerange: string;
  status: FlowDeleteRequestStatus;
  progress?: number;
  created?: string | Date;
  updated?: string | Date;
  error_message?: string;
  metadata?: Record<string, any>;
}

export type FlowDeleteRequests = FlowDeleteRequest[];
