import { Response } from "express";
import {
  DeleteSourceDescriptionPathParams,
  deleteSourceDescriptionPathParamsValidator,
  GetSourceDescriptionPathParams,
  sourceDescriptionValidator,
  getSourceDescriptionPathParamsValidator,
  PutSourceDescriptionPathParams,
  putSourceDescriptionPathParamsValidator,
  sourceDescriptionBodyValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { Routes } from "./generic";
import { NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from "./middlewares";
import { sourceRepositoryToken } from "../repository";
import { inject } from "../di";

export class SourcesDescription extends Routes {
  private readonly repository = inject(sourceRepositoryToken);
  
  constructor() {
    super();

    this.route.get<any, string>(
      "/:sourceId/description",
      validator.params(getSourceDescriptionPathParamsValidator),
      validator.response(sourceDescriptionValidator),
      this.getSourceDescription.bind(this),
    );
    this.route.put<any, void, {value: string}>(
      "/:sourceId/description",
      validator.params(putSourceDescriptionPathParamsValidator),
      validator.body(sourceDescriptionBodyValidator.required()),
      this.putSourceDescription.bind(this),
    );
    this.route.delete<any, void>(
      "/:sourceId/description",
      validator.params(deleteSourceDescriptionPathParamsValidator),
      this.deleteSourceDescription.bind(this),
    );
  }

  private async getSourceDescription(
    req: ValidatedRequest<ParamsSchema<GetSourceDescriptionPathParams>>,
    res: Response<string>,
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    res.json(source?.description);
  }

  private async putSourceDescription(
    req: ValidatedRequest<ParamsBodySchema<PutSourceDescriptionPathParams, {value: string}>>,
    res: Response<void>,
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    source.description = req.body.value;
    await this.repository.putSource(source);
    res.sendStatus(204);
  }

  private async deleteSourceDescription(
    req: ValidatedRequest<ParamsSchema<DeleteSourceDescriptionPathParams>>,
    res: Response<void>,
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    source.description = undefined;
    await this.repository.putSource(source);
    res.sendStatus(204);
  }
}
