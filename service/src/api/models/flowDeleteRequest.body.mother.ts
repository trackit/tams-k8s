import { FlowDeleteRequestStatus, FlowDeleteRequest } from "@tams-k8s/api";

export class FlowDeleteRequestMother {
  private readonly flowDeleteRequest: FlowDeleteRequest;

  static created(): FlowDeleteRequestMother {
    return new FlowDeleteRequestMother({
      id: "00000000-0000-0000-0000-000000000000",
      flowId: "00000000-0000-0000-0000-000000000000",
      timerangeToDelete: "0:0_",
      deleteFlow: false,
      status: FlowDeleteRequestStatus.CREATED,
    });
  }

  withId(id: string) {
    this.flowDeleteRequest.id = id;

    return this;
  }

  withFlowId(flowId: string) {
    this.flowDeleteRequest.flowId = flowId;

    return this;
  }

  withStatus(status: FlowDeleteRequestStatus) {
    this.flowDeleteRequest.status = status;

    return this;
  }

  withTimerangeToDelete(timerange: string) {
    this.flowDeleteRequest.timerangeToDelete = timerange;

    return this;
  }

  withDeleteFlow(deleteFlow: boolean) {
    this.flowDeleteRequest.deleteFlow = deleteFlow;

    return this;
  }

  build() {
    return this.flowDeleteRequest;
  }

  constructor(flowDeleteRequest: FlowDeleteRequest) {
    this.flowDeleteRequest = flowDeleteRequest;
  }
}
