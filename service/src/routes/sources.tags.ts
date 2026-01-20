import { Response } from "express";
import {
  DeleteSourceTagPathParams,
  deleteSourceTagPathParamsValidator,
  SourceTags,
  sourceTagsValidator,
  sourceTagValidator,
  GetSourceTagPathParams,
  getSourceTagPathParamsValidator,
  GetSourceTagsPathParams,
  getSourceTagsPathParamsValidator,
  PutSourceTagPathParams,
  putSourceTagPathParamsValidator,
  sourceTagBodyValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { Routes } from "./generic";
import {
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsSchema,
  validator,
} from "./middlewares";
import { inject } from "../di";
import { sourceRepositoryToken } from "../repository";

export class SourcesTags extends Routes {
  private readonly repository = inject(sourceRepositoryToken);

  constructor() {
    super();

    this.route.get<any, SourceTags>(
      "/:sourceId/tags",
      validator.params(getSourceTagsPathParamsValidator),
      validator.response(sourceTagsValidator.required()),
      this.getSourceTags.bind(this)
    );
    this.route.get<any, string | string[]>(
      "/:sourceId/tags/:name",
      validator.params(getSourceTagPathParamsValidator),
      validator.response(sourceTagValidator.required()),
      this.getSourceTag.bind(this)
    );
    this.route.put<any, void>(
      "/:sourceId/tags/:name",
      validator.params(putSourceTagPathParamsValidator),
      validator.body(sourceTagBodyValidator.required()),
      this.putSourceTag.bind(this)
    );
    this.route.delete<any, void>(
      "/:sourceId/tags/:name",
      validator.params(deleteSourceTagPathParamsValidator),
      this.deleteSourceTag.bind(this)
    );
  }

  private async getSourceTags(
    req: ValidatedRequest<ParamsSchema<GetSourceTagsPathParams>>,
    res: Response<SourceTags>
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null) {
      throw new NotFoundHttpError("Source could not be found");
    }
    res.json(source.tags || {});
  }

  private async getSourceTag(
    req: ValidatedRequest<ParamsSchema<GetSourceTagPathParams>>,
    res: Response<string | string[]>
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" could not be found`
      );
    if (source.tags?.[req.params.name] === undefined)
      throw new NotFoundHttpError(
        `Tag "${req.params.name}" could not be found`
      );
    res.json(source.tags[req.params.name]);
  }

  private async putSourceTag(
    req: ValidatedRequest<
      ParamsBodySchema<PutSourceTagPathParams, { value: string }>
    >,
    res: Response<void>
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" could not be found`
      );
    source.tags = source.tags || {};
    source.tags[req.params.name] = req.body.value;
    await this.repository.putSource(source);
    res.sendStatus(204);
  }

  private async deleteSourceTag(
    req: ValidatedRequest<ParamsSchema<DeleteSourceTagPathParams>>,
    res: Response
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError(
        `Source "${req.params.sourceId}" could not be found`
      );
    if (source.tags?.[req.params.name] === undefined)
      throw new NotFoundHttpError(
        `Tag "${req.params.name}" could not be found`
      );
    delete source.tags[req.params.name];
    await this.repository.putSource(source);
    res.sendStatus(204);
  }
}
