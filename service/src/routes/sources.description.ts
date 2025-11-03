import { Response } from "express";
import {
  headSourceDescriptionPathParamsValidator,
  DeleteSourceDescriptionPathParams,
  deleteSourceDescriptionPathParamsValidator,
  GetSourceDescriptionPathParams,
  sourceDescriptionValidator,
  getSourceDescriptionPathParamsValidator,
  PutSourceDescriptionPathParams,
  putSourceDescriptionPathParamsValidator,
  HeadSourceDescriptionPathParams,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import { NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from "./middlewares";

export class SourcesDescription extends Routes {
  constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
    super(repositories, backends);

    this.route.head<any, void>(
      "/:sourceId/description",
      validator.params(headSourceDescriptionPathParamsValidator),
      this.headSourceDescription.bind(this),
    );
    this.route.get<any, string>(
      "/:sourceId/description",
      validator.params(getSourceDescriptionPathParamsValidator),
      validator.response(sourceDescriptionValidator),
      this.getSourceDescription.bind(this),
    );
    this.route.put<any, void, string>(
      "/:sourceId/description",
      validator.params(putSourceDescriptionPathParamsValidator),
      validator.body(sourceDescriptionValidator.required()),
      this.putSourceDescription.bind(this),
    );
    this.route.delete<any, void>(
      "/:sourceId/description",
      validator.params(deleteSourceDescriptionPathParamsValidator),
      this.deleteSourceDescription.bind(this),
    );
  }

  async headSourceDescription(
    req: ValidatedRequest<ParamsSchema<HeadSourceDescriptionPathParams>>,
    res: Response<void>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    res.sendStatus(200);
  }

  async getSourceDescription(
    req: ValidatedRequest<ParamsSchema<GetSourceDescriptionPathParams>>,
    res: Response<string>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    res.json(source?.description);
  }

  async putSourceDescription(
    req: ValidatedRequest<ParamsBodySchema<PutSourceDescriptionPathParams, string>>,
    res: Response<void>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    source.description = req.body;
    await sourceRepository.putSource(source);
    res.sendStatus(204);
  }

  async deleteSourceDescription(
    req: ValidatedRequest<ParamsSchema<DeleteSourceDescriptionPathParams>>,
    res: Response<void>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    source.description = undefined;
    await sourceRepository.putSource(source);
    res.sendStatus(204);
  }
}
