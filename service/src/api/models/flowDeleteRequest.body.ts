export enum FlowDeleteRequestStatus {
  CREATED = "created",
  STARTED = "started",
  DONE = "done",
  ERROR = "error",
}

export interface ErrorMetadata {
  type: string;
  summary: string;
  traceback?: string[];
  time: string | Date;
}

export interface FlowDeleteRequest {
  id: string;
  flowId: string;
  timerangeToDelete: string;
  timerangeRemaining?: string;
  deleteFlow: boolean;
  progress?: number;
  created?: string | Date;
  createdBy?: string;
  updated?: string | Date;
  expiry?: string | Date;
  status: FlowDeleteRequestStatus;
  error?: ErrorMetadata;
}

export type FlowDeleteRequests = FlowDeleteRequest[];
