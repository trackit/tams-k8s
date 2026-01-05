import { Response } from 'express';
import { ValidatedRequest } from 'express-joi-validation';
import {
  FlowDeleteRequest,
  flowDeleteRequestValidator,
  flowDeleteRequestsValidator,
  GetFlowDeleteRequestsPathParams,
  getFlowDeleteRequestsPathParamsValidator,
} from '@tams-k8s/api';
import { NotFoundHttpError, ParamsSchema, validator } from './middlewares';
import { Routes } from './generic';
import { flowDeleteRequestsRepositoryToken } from '../repository';
import { inject } from '../di';

export class FlowDeleteRequestsRoutes extends Routes {
  private readonly repository = inject(flowDeleteRequestsRepositoryToken);

  constructor() {
    super();

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

  private async listFlowDeleteRequests(
    _: any,
    res: Response<FlowDeleteRequest[]>
  ) {
      const requests = await this.repository.listFlowDeleteRequest();
      res.json(requests);
  }

  private async getFlowDeleteRequest(
    req: ValidatedRequest<ParamsSchema<GetFlowDeleteRequestsPathParams>>,
    res: Response<FlowDeleteRequest>
  ): Promise<void> {
    const request = await this.repository.getFlowDeleteRequestById(
      req.params.requestId
    );

    if (!request) throw new NotFoundHttpError("Flow delete request not found");
    res.json(request);
  }
}
