import { Response } from 'express';
import { ValidatedRequest } from 'express-joi-validation';
import {
  FlowDeleteRequest,
  flowDeleteRequestValidator,
  flowDeleteRequestsValidator,
  GetFlowDeleteRequestsPathParams,
  getFlowDeleteRequestsPathParamsValidator,
} from '@tams-k8s/api';
import { NotFoundHttpError, BodySchema, ParamsSchema, validator } from './middlewares';
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
    this.route.post<any, FlowDeleteRequest>(
      "/",
      validator.body(flowDeleteRequestValidator.required()),
      validator.response(flowDeleteRequestValidator),
      this.postFlowDeleteRequest.bind(this),
    );
    this.route.get<any, FlowDeleteRequest>(
      "/:requestId",
      validator.params(getFlowDeleteRequestsPathParamsValidator),
      validator.response(flowDeleteRequestValidator),
      this.getFlowDeleteRequest.bind(this),
    );
    this.route.delete<any, void>(
      "/:requestId",
      validator.params(getFlowDeleteRequestsPathParamsValidator),
      this.deleteFlowDeleteRequest.bind(this),
    );
  }

  private async listFlowDeleteRequests(
    _: any,
    res: Response<FlowDeleteRequest[]>
  ) {
    const requests = await this.repository.listFlowDeleteRequest();
    res.json(requests);
  }

  private async postFlowDeleteRequest(
    req: ValidatedRequest<BodySchema<FlowDeleteRequest>>,
    res: Response<FlowDeleteRequest>
  ): Promise<void> {
    const now = new Date();
    const body = req.body;
    const request: FlowDeleteRequest = {
      ...body,
      created: body.created ?? now,
      updated: body.updated ?? now,
    };
    await this.repository.saveFlowDeleteRequest(request);
    res.status(201).json(request);
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

  private async deleteFlowDeleteRequest(
    req: ValidatedRequest<ParamsSchema<GetFlowDeleteRequestsPathParams>>,
    res: Response<void>
  ): Promise<void> {
    const deleted = await this.repository.deleteFlowDeleteRequest(
      req.params.requestId
    );
    if (!deleted) throw new NotFoundHttpError("Flow delete request not found");
    res.sendStatus(204);
  }
}
