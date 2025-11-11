import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  Source,
  sourceValidator,
  sourcesValidator,
  HeadSourcePathParams,
  GetSourcePathParams,
  getSourcePathParamsValidator,
  GetSourcesQueryParamsRequest,
  listSourcesQueryParamsValidator,
  HeadSourcesQueryParamsRequest,
} from "@tams-k8s/api";
import { Factory } from '../repository/factory';
import { SourcesDescription } from "./sources.description";
import { SourcesLabel } from "./sources.label";
import { SourcesTags } from "./sources.tags";
import { BackendManager } from "../backend/manager";
import { SourceAdapter } from "../repository/adapters/source.adapter";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import {
  BadRequestHttpError,
  NotFoundHttpError,
  ParamsSchema,
  QSSchema,
  validator,
} from "./middlewares";
import { InvalidPageTokenError } from "repository/errors";

export class SourcesRoutes extends Routes {
  constructor(repositories: Factory, backends: BackendManager) {
    super(repositories, backends);

    const sourcesDescriptionRoutes = new SourcesDescription(repositories, backends);
    const sourcesLabelRoutes = new SourcesLabel(repositories, backends);
    const sourcesTagsRoutes = new SourcesTags(repositories, backends);

    this.route.get(
      "/",
      validator.query(listSourcesQueryParamsValidator),
      validator.response(sourcesValidator),
      this.listSources.bind(this),
    );
    this.route.get<any, Source>(
      "/:sourceId",
      validator.params(getSourcePathParamsValidator),
      validator.response(sourceValidator.required()),
      this.getSource.bind(this),
    );
    this.route.use(sourcesDescriptionRoutes.getRoutes());
    this.route.use(sourcesLabelRoutes.getRoutes());
    this.route.use(sourcesTagsRoutes.getRoutes());
  }

  private buildNextPageUrl(
    req: ValidatedRequest<QSSchema<GetSourcesQueryParamsRequest>>,
    nextPageToken: string,
  ): string {
    const url = new URL(`${req.protocol}://${req.host}${req.originalUrl}`);
    url.searchParams.set("page", nextPageToken);
    return url.toString();
  }

  private async listSources(
    req: ValidatedRequest<QSSchema<GetSourcesQueryParamsRequest>>,
    res: Response<Source[]>,
  ) {
    const sourceRepo = this.repositories.getSourceRepository();
    const tags: Record<string, string> = {};
    const haveTags: string[] = [];
    const doesNotHaveTags: string[] = [];

    Object.entries(req.query).forEach(([key, value]) => {
      if (key.startsWith("tag_exists.")) {
        if (value) haveTags.push(key.replace("tag_exists.", ""));
        else doesNotHaveTags.push(key.replace("tag_exists.", ""));
      }
      if (key.startsWith("tag.") && typeof value === "string")
        tags[key.replace("tag.", "")] = value;
    });

    try {
      const list = await sourceRepo.listSources({
        label: req.query.label,
        format: req.query.format,
        page: req.query.page,
        limit: req.query.limit,
        tags,
        haveTags,
        doesNotHaveTags,
      });

      if (list.limit !== undefined) res.setHeader("X-Paging-Limit", list.limit.toString());
      if (list.nextPageToken !== undefined) {
        res.setHeader("X-Paging-NextKey", list.nextPageToken);
        res.setHeader("Link", `<${this.buildNextPageUrl(req, list.nextPageToken)}>; rel="next"`);
      }

      res.json(list.sources.map(source => SourceAdapter.toApi(source)));
    } catch (e) {
      if (e instanceof InvalidPageTokenError) {
        throw new BadRequestHttpError(e.message);
      }
      throw e;
    }
  }

  private async getSource(
    req: ValidatedRequest<ParamsSchema<GetSourcePathParams>>,
    res: Response<Source>,
  ) {
    const sourceRepository = this.repositories.getSourceRepository();
    const source = await sourceRepository.getSourceById(req.params.sourceId);
    if (source === null) throw new NotFoundHttpError("Source could not be found");
    res.json(SourceAdapter.toApi(source));
  }
}
