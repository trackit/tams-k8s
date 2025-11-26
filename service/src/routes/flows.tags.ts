import { Response } from "express";
import {
  DeleteFlowTagPathParams,
  deleteFlowTagPathParamsValidator,
  FlowTags,
  flowTagsValidator,
  flowTagValidator,
  GetFlowTagPathParams,
  getFlowTagPathParamsValidator,
  GetFlowTagsPathParams,
  getFlowTagsPathParamsValidator,
  PutFlowTagPathParams,
  putFlowTagPathParamsValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Factory } from "../repository/factory";
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

export class FlowsTags extends Routes {
  private readonly repository = inject(flowRepositoryToken);

  constructor() {
    super();

    this.route.get<any, FlowTags>(
      "/:flowId/tags",
      validator.params(getFlowTagsPathParamsValidator),
      validator.response(flowTagsValidator.required()),
      this.getFlowTags.bind(this)
    );
    this.route.get<any, string>(
      "/:flowId/tags/:name",
      validator.params(getFlowTagPathParamsValidator),
      validator.response(flowTagValidator.required()),
      this.getFlowTag.bind(this)
    );
    this.route.put<any, void>(
      "/:flowId/tags/:name",
      validator.params(putFlowTagPathParamsValidator),
      validator.body(flowTagValidator.required()),
      this.putFlowTag.bind(this)
    );
    this.route.delete<any, void>(
      "/:flowId/tags/:name",
      validator.params(deleteFlowTagPathParamsValidator),
      this.deleteFlowTag.bind(this)
    );
  }

  private async getFlowTags(
    req: ValidatedRequest<ParamsSchema<GetFlowTagsPathParams>>,
    res: Response<FlowTags>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null) throw new NotFoundHttpError("Flow could not be found");
    res.json(flow.tags);
  }

  private async getFlowTag(
    req: ValidatedRequest<ParamsSchema<GetFlowTagPathParams>>,
    res: Response<string>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    if (flow.tags?.[req.params.name] === undefined)
      throw new NotFoundHttpError(
        `Tag "${req.params.name}" could not be found`
      );
    res.json(flow.tags[req.params.name]);
  }

  private async putFlowTag(
    req: ValidatedRequest<ParamsBodySchema<PutFlowTagPathParams, string>>,
    res: Response<void>
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    if (flow.readOnly === true)
      throw new ForbiddenHttpError("Flow is in read only mode");
    flow.tags = flow.tags || {};
    flow.tags[req.params.name] = req.body;
    flow.metadataUpdated = new Date();
    await this.repository.putFlow(flow);
    res.sendStatus(204);
  }

  private async deleteFlowTag(
    req: ValidatedRequest<ParamsSchema<DeleteFlowTagPathParams>>,
    res: Response
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    if (flow.readOnly === true)
      throw new ForbiddenHttpError("Flow is in read only mode");
    if (flow.tags?.[req.params.name] === undefined)
      throw new NotFoundHttpError(
        `Tag "${req.params.name}" could not be found`
      );
    delete flow.tags[req.params.name];
    flow.metadataUpdated = new Date();
    await this.repository.putFlow(flow);
    res.sendStatus(204);
  }
}
