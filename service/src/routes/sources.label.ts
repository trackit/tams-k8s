import { Response } from "express";
import {
  DeleteSourceLabelPathParams,
  deleteSourceLabelPathParamsValidator,
  sourceLabelValidator,
  GetSourceLabelPathParams,
  getSourceLabelPathParamsValidator,
  PutSourceLabelPathParams,
  putSourceLabelPathParamsValidator,
  sourceLabelBodyValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import {
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsSchema,
  validator,
} from "./middlewares";

export class SourcesLabel extends Routes {
  constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
    super(repositories, backends);

    this.route.get<any, string>(
      "/:sourceId/label",
      validator.params(getSourceLabelPathParamsValidator),
      validator.response(sourceLabelValidator),
      this.getSourceLabel.bind(this)
    );
    this.route.put<any, void, { value: string }>(
      "/:sourceId/label",
      validator.params(putSourceLabelPathParamsValidator),
      validator.body(sourceLabelBodyValidator.required()),
      this.putSourceLabel.bind(this)
    );
    this.route.delete<any, void>(
      "/:sourceId/label",
      validator.params(deleteSourceLabelPathParamsValidator),
      this.deleteSourceLabel.bind(this)
    );
  }

  private async getSourceLabel(
    req: ValidatedRequest<ParamsSchema<GetSourceLabelPathParams>>,
    res: Response<string>
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" could not be found`
      );
    if (source.label === undefined)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" doesn't have label`
      );
    res.json(source?.label);
  }

  private async putSourceLabel(
    req: ValidatedRequest<
      ParamsBodySchema<PutSourceLabelPathParams, { value: string }>
    >,
    res: Response<void>
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" could not be found`
      );
    source.label = req.body.value;
    await sourceRepository.putSource(source);
    res.sendStatus(204);
  }

  private async deleteSourceLabel(
    req: ValidatedRequest<ParamsSchema<DeleteSourceLabelPathParams>>,
    res: Response<void>
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" could not be found`
      );
    source.label = undefined;
    await sourceRepository.putSource(source);
    res.sendStatus(204);
  }
}
