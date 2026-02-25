import { Response } from "express";
import {
  DeleteFlowFlowCollectionPathParams,
  deleteFlowFlowCollectionPathParamsValidator,
  FlowCollectionItem,
  flowFlowCollectionValidator,
  GetFlowFlowCollectionPathParams,
  getFlowFlowCollectionPathParamsValidator,
  PutFlowFlowCollectionPathParams,
  putFlowFlowCollectionPathParamsValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { FlowAdapter } from "../repository/adapters/flow.adapter";
import { Routes } from "./generic";
import {
  ForbiddenHttpError,
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsSchema,
  validator,
} from "./middlewares";
import { inject } from "../di";
import { flowRepositoryToken } from "../repository";

export class FlowsFlowCollection extends Routes {
  private readonly repository = inject(flowRepositoryToken);

  constructor() {
    super();

    this.route.get<any, FlowCollectionItem[]>(
      "/:flowId/flow_collection",
      validator.params(getFlowFlowCollectionPathParamsValidator),
      validator.response(flowFlowCollectionValidator.required()),
      this.getFlowFlowCollection.bind(this)
    );
    this.route.put<any, void, FlowCollectionItem[]>(
      "/:flowId/flow_collection",
      validator.params(putFlowFlowCollectionPathParamsValidator),
      validator.body(flowFlowCollectionValidator.required()),
      this.putFlowFlowCollection.bind(this)
    );
    this.route.delete<any, void>(
      "/:flowId/flow_collection",
      validator.params(deleteFlowFlowCollectionPathParamsValidator),
      this.deleteFlowFlowCollection.bind(this)
    );
  }

  async getFlowFlowCollection(
    req: ValidatedRequest<ParamsSchema<GetFlowFlowCollectionPathParams>>,
    res: Response<FlowCollectionItem[]>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    res.json(FlowAdapter.toApiFlowCollection(flow.flowCollection ?? []));
  }

  async putFlowFlowCollection(
    req: ValidatedRequest<
      ParamsBodySchema<PutFlowFlowCollectionPathParams, FlowCollectionItem[]>
    >,
    res: Response<void>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    if (flow.readOnly === true)
      throw new ForbiddenHttpError("Flow is in read only mode");
    flow.metadataUpdated = new Date();
    flow.flowCollection =
      req.body.length > 0
        ? FlowAdapter.fromApiFlowCollection(req.body)
        : undefined;
    await this.repository.putFlow(flow);
    res.sendStatus(204);
  }

  async deleteFlowFlowCollection(
    req: ValidatedRequest<ParamsSchema<DeleteFlowFlowCollectionPathParams>>,
    res: Response<void>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    if (flow.readOnly === true)
      throw new ForbiddenHttpError("Flow is in read only mode");
    flow.metadataUpdated = new Date();
    flow.flowCollection = undefined;
    await this.repository.putFlow(flow);
    res.sendStatus(204);
  }
}
