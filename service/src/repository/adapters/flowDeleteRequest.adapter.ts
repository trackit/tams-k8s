import { FlowDeleteRequest as ApiFlowDeleteRequest } from "@tams-k8s/api";
import { FlowDeleteRequest as RepoFlowDeleteRequest } from "../flowDeleteRequests";

export class FlowDeleteRequestAdapter {
  // fromAPI
  static fromFlowDeleteRequest(flowDeleteRequest: ApiFlowDeleteRequest): RepoFlowDeleteRequest {
    return {
      id: flowDeleteRequest.id,
      flowId: flowDeleteRequest.flow_id,
      timerange: flowDeleteRequest.timerange,
      status: flowDeleteRequest.status,
      progress: flowDeleteRequest.progress,
      created: flowDeleteRequest.created,
      updated: flowDeleteRequest.updated,
      errorMessage: flowDeleteRequest.error_message,
      metadata: flowDeleteRequest.metadata,
    };
  }

  // toApi
  static toFlowDeleteRequest(flowDeleteRequest: RepoFlowDeleteRequest): ApiFlowDeleteRequest {
    return {
      id: flowDeleteRequest.id,
      flow_id: flowDeleteRequest.flowId,
      timerange: flowDeleteRequest.timerange,
      status: flowDeleteRequest.status,
      progress: flowDeleteRequest.progress,
      created: flowDeleteRequest.created,
      updated: flowDeleteRequest.updated,
      error_message: flowDeleteRequest.errorMessage,
      metadata: flowDeleteRequest.metadata,
    };
  }
}
