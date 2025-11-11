import { Response } from "express";
import {
  DeleteSourceLabelPathParams,
  deleteSourceLabelPathParamsValidator,
  sourceLabelValidator,
  GetSourceLabelPathParams,
  getSourceLabelPathParamsValidator,
  PutSourceLabelPathParams,
  putSourceLabelPathParamsValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import { NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from "./middlewares";

export class SourcesLabel extends Routes {
  constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
    super(repositories, backends);

    this.route.get<any, string>(
      "/:sourceId/label",
      validator.params(getSourceLabelPathParamsValidator),
      validator.response(sourceLabelValidator),
      this.getSourceLabel.bind(this),
    );
    this.route.put<any, void, string>(
      "/:sourceId/label",
      validator.params(putSourceLabelPathParamsValidator),
      validator.body(sourceLabelValidator.required()),
      this.putSourceLabel.bind(this),
    );
    this.route.delete<any, void>(
      "/:sourceId/label",
      validator.params(deleteSourceLabelPathParamsValidator),
      this.deleteSourceLabel.bind(this),
    );
  }

  private async getSourceLabel(
    req: ValidatedRequest<ParamsSchema<GetSourceLabelPathParams>>,
    res: Response<string>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    res.json(source?.label);
  }

  private async putSourceLabel(
    req: ValidatedRequest<ParamsBodySchema<PutSourceLabelPathParams, string>>,
    res: Response<void>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    source.label = req.body;
    await sourceRepository.putSource(source);
    res.sendStatus(204);
  }

  private async deleteSourceLabel(
    req: ValidatedRequest<ParamsSchema<DeleteSourceLabelPathParams>>,
    res: Response<void>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(`Source "${req.params.sourceId}" could not be found`);
    source.label = undefined;
    await sourceRepository.putSource(source);
    res.sendStatus(204);
  }
}
