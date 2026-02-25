import type { FlowDeleteRequest } from "@tams-k8s/api";
import { FlowDeleteRequestsRepository } from "../index";

export class MemoryFlowDeleteRequestsRepository
  implements FlowDeleteRequestsRepository
{
  private readonly flowDeleteRequests: FlowDeleteRequest[];

  constructor(initialFlowDeleteRequests?: FlowDeleteRequest[]) {
    this.flowDeleteRequests = initialFlowDeleteRequests ?? [];
  }

  getInternal(): FlowDeleteRequest[] {
    return this.flowDeleteRequests;
  }

  async listFlowDeleteRequest(): Promise<FlowDeleteRequest[]> {
    return this.flowDeleteRequests;
  }

  async getFlowDeleteRequestById(
    flowDeleteRequestId: string
  ): Promise<FlowDeleteRequest | null> {
    return (
      this.flowDeleteRequests.find(
        ({ id: findFlowDeleteRequestId }) =>
          findFlowDeleteRequestId === flowDeleteRequestId
      ) ?? null
    );
  }

  async saveFlowDeleteRequest(flowDeleteRequest: FlowDeleteRequest) {
    this.flowDeleteRequests.push(flowDeleteRequest);
  }

  async deleteFlowDeleteRequest(requestId: string): Promise<boolean> {
    const index = this.flowDeleteRequests.findIndex(
      ({ id }) => id === requestId
    );
    if (index === -1) return false;
    this.flowDeleteRequests.splice(index, 1);
    return true;
  }
}
