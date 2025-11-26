import { Response } from "express";
import {
  DeleteFlowDescriptionPathParams,
  deleteFlowDescriptionPathParamsValidator,
  flowDescriptionValidator,
  GetFlowDescriptionPathParams,
  getFlowDescriptionPathParamsValidator,
  PutFlowDescriptionPathParams,
  putFlowDescriptionPathParamsValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
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

export class FlowsDescription extends Routes {
  private readonly repository = inject(flowRepositoryToken);

  constructor() {
    super();

    this.route.get<any, string>(
      "/:flowId/description",
      validator.params(getFlowDescriptionPathParamsValidator),
      validator.response(flowDescriptionValidator),
      this.getFlowDescription.bind(this)
    );
    this.route.put<any, void, string>(
      "/:flowId/description",
      validator.params(putFlowDescriptionPathParamsValidator),
      validator.body(flowDescriptionValidator.required()),
      this.putFlowDescription.bind(this)
    );
    this.route.delete<any, void>(
      "/:flowId/description",
      validator.params(deleteFlowDescriptionPathParamsValidator),
      this.deleteFlowDescription.bind(this)
    );
  }

  async getFlowDescription(
    req: ValidatedRequest<ParamsSchema<GetFlowDescriptionPathParams>>,
    res: Response<string>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    res.json(flow?.description);
  }

  async putFlowDescription(
    req: ValidatedRequest<
      ParamsBodySchema<PutFlowDescriptionPathParams, string>
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
    flow.description = req.body;
    await this.repository.putFlow(flow);
    res.sendStatus(204);
  }

  async deleteFlowDescription(
    req: ValidatedRequest<ParamsSchema<DeleteFlowDescriptionPathParams>>,
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
    flow.description = undefined;
    await this.repository.putFlow(flow);
    res.sendStatus(204);
  }
}
