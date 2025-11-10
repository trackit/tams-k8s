import { FlowDeleteRequestStatus, FlowDeleteRequest } from "@tams-k8s/api";

class FlowDeleteRequestMother {
  private readonly flowDeleteRequest: FlowDeleteRequest;

  static pending(): FlowDeleteRequestMother {
    return new FlowDeleteRequestMother({
      id: '1',
      timerange: '0:0_',
      status: FlowDeleteRequestStatus.PENDING
    });
  }

  withId(flowId: string) {
    this.flowDeleteRequest.flow_id = flowId;

    return this;
  }

  withStatus(status: FlowDeleteRequestStatus) {
    this.flowDeleteRequest.status = status;

    return this;
  }

  build() {
    return this.flowDeleteRequest
  }

  constructor(flowDeleteRequest: FlowDeleteRequest) {
    this.flowDeleteRequest = flowDeleteRequest;
  }
}
