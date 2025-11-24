import type { FlowDeleteRequest } from "@tams-k8s/api";
import { FlowDeleteRequestsRepository } from "../index";

export class MemoryFlowDeleteRequestsRepository implements FlowDeleteRequestsRepository {
  private readonly flowDeleteRequests: FlowDeleteRequest[];

  constructor() {
    this.flowDeleteRequests = [];
  }

  async listFlowDeleteRequest(): Promise<FlowDeleteRequest[]> {
    return this.flowDeleteRequests;
  }

  async getFlowDeleteRequestById(flowDeleteRequestId: string): Promise<FlowDeleteRequest | null> {
    return (
      this.flowDeleteRequests.find(
        ({ id: findFlowDeleteRequestId }) => findFlowDeleteRequestId === flowDeleteRequestId,
      ) ?? null
    );
  }

  async saveFlowDeleteRequest(flowDeleteRequest: FlowDeleteRequest) {
    this.flowDeleteRequests.push(flowDeleteRequest);
  }
}
