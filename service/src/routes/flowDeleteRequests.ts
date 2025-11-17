import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  FlowDeleteRequest,
  flowDeleteRequestValidator,
  flowDeleteRequestsValidator,
  GetFlowDeleteRequestsPathParams,
  getFlowDeleteRequestsPathParamsValidator,
} from "@tams-k8s/api";
import { RepositoriesBuilder } from "../repository/builder";
import { BackendManager } from "../backend/manager";
import { NotFoundHttpError, ParamsSchema, validator } from "./middlewares";
import { Routes } from "./generic";
import {flowDeleteRequestsRepositoryToken} from "../repository/flowDeleteRequests";
import {inject} from "../di";

export class FlowDeleteRequestsRoutes extends Routes {
  private readonly repo = inject(flowDeleteRequestsRepositoryToken)

  constructor(repositories: RepositoriesBuilder, backends: BackendManager) { // TODO: remove params
    super(repositories, backends); // TODO: remove this

    this.route.get(
      "/",
      validator.response(flowDeleteRequestsValidator),
      this.listFlowDeleteRequests.bind(this),
    );
    this.route.get<any, FlowDeleteRequest>(
      "/:requestId",
      validator.params(getFlowDeleteRequestsPathParamsValidator),
      validator.response(flowDeleteRequestValidator),
      this.getFlowDeleteRequest.bind(this),
    );
  }

  private async listFlowDeleteRequests(_: any, res: Response<FlowDeleteRequest[]>) {
    try {
      const requests = await this.repo.listFlowDeleteRequest();
      res.json(requests);
    } catch (e) {
      throw e;
    }
  }

  private async getFlowDeleteRequest(
    req: ValidatedRequest<ParamsSchema<GetFlowDeleteRequestsPathParams>>,
    res: Response<FlowDeleteRequest>,
  ): Promise<void> {
    const request = await this.repo.getFlowDeleteRequestById(req.params.requestId);

    if (!request) throw new NotFoundHttpError("Flow delete request not found");
    res.json(request);
  }
}
