import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  FlowDeleteRequest,
  flowDeleteRequestValidator,
  flowDeleteRequestsValidator,
  HeadFlowDeleteRequestsPathParams,
  GetFlowDeleteRequestsPathParams,
  headFlowDeleteRequestsPathParamsValidator,
  getFlowDeleteRequestsPathParamsValidator,
} from "@tams-k8s/api";
import { RepositoriesBuilder } from "../repository/builder";
import { BackendManager } from "../backend/manager";
import {
  BadRequestHttpError,
  ForbiddenHttpError,
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsQSSchema,
  QSSchema,
  ParamsSchema,
  validator,
} from "./middlewares";
import { Routes } from "./generic";

export class FlowDeleteRequestsRoutes extends Routes {
  constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
    super(repositories, backends);

    this.route.head("/", this.headListFlowDeleteRequests.bind(this));
    this.route.get(
      "/",
      validator.response(flowDeleteRequestsValidator),
      this.listFlowDeleteRequests.bind(this),
    );
    this.route.head(
      "/:requestId",
      validator.params(headFlowDeleteRequestsPathParamsValidator),
      this.headFlowDeleteRequest.bind(this),
    );
    this.route.get<any, FlowDeleteRequest>(
      "/:requestId",
      validator.params(getFlowDeleteRequestsPathParamsValidator),
      validator.response(flowDeleteRequestValidator),
      this.getFlowDeleteRequest.bind(this),
    );
  }

  private async headListFlowDeleteRequests(_: any, res: Response): Promise<void> {
    res.sendStatus(200);
  }

  private async listFlowDeleteRequests(res: Response<FlowDeleteRequest[]>) {
    const repo = this.repositories.getFlowDeleteRequestsRepository();
    try {
      const requests = await repo.listFlowDeleteRequest();
      res.json(requests);
    } catch (e) {
      throw e;
    }
  }

  private async headFlowDeleteRequest(
    req: ValidatedRequest<QSSchema<HeadFlowDeleteRequestsPathParams>>,
    res: Response,
  ) {
    const repo = this.repositories.getFlowDeleteRequestsRepository();
    const request = await repo.getFlowDeleteRequestById(req.params.requestId);

    if (!request) throw new NotFoundHttpError("Flow delete request not found");
    res.sendStatus(200);
  }

  private async getFlowDeleteRequest(
    req: ValidatedRequest<ParamsSchema<GetFlowDeleteRequestsPathParams>>,
    res: Response<FlowDeleteRequest>,
  ): Promise<void> {
    const repo = this.repositories.getFlowDeleteRequestsRepository();
    const request = await repo.getFlowDeleteRequestById(req.params.requestId);

    if (!request) throw new NotFoundHttpError("Flow delete request not found");
    res.json(request);
  }
}
