import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  Source,
  sourceValidator,
  sourcesValidator,
  SourceTags,
  sourceTagsValidator,
  GetSourcePathParams,
  getSourcePathParamsValidator,
  GetSourcesQueryParamsRequest,
  PutSourcePathParams,
  putSourcePathParamsValidator,
  listSourcesQueryParamsValidator,
  GetSourceTagsPathParams,
  getSourceTagsPathParamsValidator,
} from "@tams-k8s/api";
import { BackendManager } from "../backend/manager";
import { SourceAdapter } from "../repository/adapters/source.adapter";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import {
  BadRequestHttpError,
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsSchema,
  QSSchema,
  validator,
} from "./middlewares";

export class SourceRoutes extends Routes {
  constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
    super(repositories, backends);

    this.route.get(
      "/",
      validator.query(listSourcesQueryParamsValidator),
      validator.response(sourcesValidator),
      this.listSources.bind(this)
    );

    this.route.get<any, Source>(
      "/:sourceId",
      validator.params(getSourcePathParamsValidator),
      validator.response(sourceValidator.required()),
      this.getSource.bind(this)
    );

    this.route.put<any, Source>(
      "/:sourceId",
      validator.params(putSourcePathParamsValidator),
      validator.body(sourceValidator.required()),
      validator.response(sourceValidator.required()),
      this.putSource.bind(this)
    );

    this.route.get<any, SourceTags>(
      "/:sourceId/tags",
      validator.params(getSourceTagsPathParamsValidator),
      validator.response(sourceTagsValidator.required()),
      this.getSourceTags.bind(this)
    );
  }

  private async listSources(
    req: ValidatedRequest<QSSchema<GetSourcesQueryParamsRequest>>,
    res: Response<Source[]>
  ) {
    const sourceRepo = this.repositories.getSourceRepository();
    const tags: Record<string, string> = {};
    const haveTags: string[] = [];
    const doesNotHaveTags: string[] = [];

    Object.entries(req.query).forEach(([key, value]) => {
      if (key.startsWith("tag_exists.")) {
        if (value) {
          haveTags.push(key.replace("tag_exists.", ""));
        } else {
          doesNotHaveTags.push(key.replace("tag_exists.", ""));
        }
      }
      if (key.startsWith("tag.") && typeof value === "string") {
        tags[key.replace("tag.", "")] = value;
      }
    });

    const sources = await sourceRepo.listSources({
      label: req.query.label,
      format: req.query.format,
      page: req.query.page,
      limit: req.query.limit,
      tags,
      haveTags,
      doesNotHaveTags,
    });

    res.json(sources.sources.map((source) => SourceAdapter.toApi(source)));
  }

  private async getSource(
    req: ValidatedRequest<ParamsSchema<GetSourcePathParams>>,
    res: Response<Source>
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null) {
      throw new NotFoundHttpError("Source could not be found");
    }
    res.json(SourceAdapter.toApi(source));
  }

  private async putSource(
    req: ValidatedRequest<ParamsBodySchema<PutSourcePathParams, Source>>,
    res: Response<Source>
  ) {
    if (req.params.sourceId !== req.body.id) {
      throw new BadRequestHttpError("Source ID does not match URL parameter");
    }

    const sourceRepository = this.repositories.getSourceRepository();
    const currentSource = await sourceRepository.getSourceById(
      req.params.sourceId
    );
    const sourceToPut = SourceAdapter.fromApi(req.body);
    const now = new Date();

    sourceToPut.created = currentSource?.created || now;
    sourceToPut.updated = now;
    sourceToPut.createdBy = currentSource?.createdBy;
    sourceToPut.updatedBy = req.body.updated_by;

    const source = await sourceRepository.putSource(sourceToPut);
    res.json(SourceAdapter.toApi(source));
  }

  private async getSourceTags(
    req: ValidatedRequest<ParamsSchema<GetSourceTagsPathParams>>,
    res: Response<SourceTags>
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null) {
      throw new NotFoundHttpError("Source could not be found");
    }
    res.json(source.tags || {});
  }
}
