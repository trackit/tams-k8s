import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  Source,
  sourceValidator,
  sourcesValidator,
  GetSourcePathParams,
  getSourcePathParamsValidator,
  GetSourcesQueryParamsRequest,
  listSourcesQueryParamsValidator,
  DeleteSourcePathParams,
  deleteSourcePathParamsValidator,
} from "@tams-k8s/api";
import { SourcesDescription } from "./sources.description";
import { SourcesLabel } from "./sources.label";
import { SourcesTags } from "./sources.tags";
import { SourceAdapter } from "../repository/adapters/source.adapter";
import { Routes } from "./generic";
import {
  BadRequestHttpError,
  NotFoundHttpError,
  ParamsSchema,
  QSSchema,
  validator,
} from "./middlewares";
import { InvalidPageTokenError } from "../repository/errors";
import { sourceRepositoryToken } from "../repository";
import { inject } from "../di";

export class SourcesRoutes extends Routes {
  private readonly repository = inject(sourceRepositoryToken);

  constructor() {
    super();

    const sourcesDescriptionRoutes = new SourcesDescription();
    const sourcesLabelRoutes = new SourcesLabel();
    const sourcesTagsRoutes = new SourcesTags();

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
    this.route.delete<any, void>(
      "/:sourceId",
      validator.params(deleteSourcePathParamsValidator),
      this.deleteSource.bind(this)
    );
    this.route.use(sourcesDescriptionRoutes.getRoutes());
    this.route.use(sourcesLabelRoutes.getRoutes());
    this.route.use(sourcesTagsRoutes.getRoutes());
  }

  private buildNextPageUrl(
    req: ValidatedRequest<QSSchema<GetSourcesQueryParamsRequest>>,
    nextPageToken: string
  ): string {
    const url = new URL(`${req.protocol}://${req.host}${req.originalUrl}`);
    url.searchParams.set("page", nextPageToken);
    return url.toString();
  }

  private async listSources(
    req: ValidatedRequest<QSSchema<GetSourcesQueryParamsRequest>>,
    res: Response<Source[]>
  ) {
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
      const list = await this.repository.listSources({
        label: req.query.label,
        format: req.query.format,
        page: req.query.page,
        limit: req.query.limit,
        tags,
        haveTags,
        doesNotHaveTags,
      });

      if (list.limit !== undefined)
        res.setHeader("X-Paging-Limit", list.limit.toString());
      if (list.nextPageToken !== undefined) {
        res.setHeader("X-Paging-NextKey", list.nextPageToken);
        res.setHeader(
          "Link",
          `<${this.buildNextPageUrl(req, list.nextPageToken)}>; rel="next"`
        );
      }

      res.json(list.sources.map((source) => SourceAdapter.toApi(source)));
    } catch (e) {
      if (e instanceof InvalidPageTokenError) {
        throw new BadRequestHttpError(e.message);
      }
      throw e;
    }
  }

  private async getSource(
    req: ValidatedRequest<ParamsSchema<GetSourcePathParams>>,
    res: Response<Source>
  ) {
    const source = await this.repository.getSourceById(req.params.sourceId);
    if (source === null)
      throw new NotFoundHttpError("Source could not be found");
    res.json(SourceAdapter.toApi(source));
  }

  private async deleteSource(
    req: ValidatedRequest<ParamsSchema<DeleteSourcePathParams>>,
    res: Response<void>
  ) {
    const currentSource = await this.repository.getSourceById(req.params.sourceId);

    if (currentSource === null)
      throw new NotFoundHttpError("Source could not be found");

    await this.repository.deleteSource(currentSource.id);
    res.sendStatus(204);
  }
}
