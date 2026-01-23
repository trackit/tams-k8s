import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  Flow,
  flowsValidator,
  flowValidator,
  GetFlowPathParams,
  getFlowPathParamsValidator,
  GetFlowQueryParamsRequest,
  getFlowQueryParamsValidator,
  GetFlowsQueryParamsRequest,
  listFlowsQueryParamsValidator,
  PutFlowPathParams,
  putFlowPathParamsValidator,
  parseTimerange,
  intersectTimeranges,
  formatTimerange,
} from "@tams-k8s/api";
import { FlowAdapter } from "../repository/adapters/flow.adapter";
import { InvalidPageTokenError } from "../repository/errors";
import { FlowsAvgBitRate } from "./flows.avgBitRate";
import { FlowsDescription } from "./flows.description";
import { FlowsFlowCollection } from "./flows.flowCollection";
import { FlowsLabel } from "./flows.label";
import { FlowsMaxBitRate } from "./flows.maxBitRate";
import { FlowMediaStorageRoutes } from "./flows.mediaStorage";
import { FlowsReadOnly } from "./flows.readOnly";
import { FlowsTags } from "./flows.tags";
import {
  BadRequestHttpError,
  ForbiddenHttpError,
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsQSSchema,
  QSSchema,
  validator,
} from "./middlewares";
import { Routes } from "./generic";
import { inject } from "../di";
import { flowRepositoryToken } from "../repository";

export class FlowsRoutes extends Routes {
  private readonly repository = inject(flowRepositoryToken);

  constructor() {
    super();

    const flowTagsRoutes = new FlowsTags();
    const flowDescriptionRoutes = new FlowsDescription();
    const flowLabelRoutes = new FlowsLabel();
    const flowReadOnlyRoutes = new FlowsReadOnly();
    const flowFlowCollectionRoutes = new FlowsFlowCollection();
    const flowMaxBitRateRoutes = new FlowsMaxBitRate();
    const flowAvgBitRateRoutes = new FlowsAvgBitRate();
    const flowMediaStorageRoutes = new FlowMediaStorageRoutes();

    this.route.get(
      "/",
      validator.query(listFlowsQueryParamsValidator),
      validator.response(flowsValidator),
      this.listFlows.bind(this),
    );
    this.route.get<any, Flow>(
      "/:flowId",
      validator.params(getFlowPathParamsValidator),
      validator.query(getFlowQueryParamsValidator.required()),
      validator.response(flowValidator.required()),
      this.getFlow.bind(this),
    );
    this.route.put<any, Flow>(
      "/:flowId",
      validator.params(putFlowPathParamsValidator),
      validator.body(flowValidator.required()),
      validator.response(flowValidator.required()),
      this.putFlow.bind(this),
    );
    this.route.use(flowTagsRoutes.getRoutes());
    this.route.use(flowDescriptionRoutes.getRoutes());
    this.route.use(flowLabelRoutes.getRoutes());
    this.route.use(flowReadOnlyRoutes.getRoutes());
    this.route.use(flowFlowCollectionRoutes.getRoutes());
    this.route.use(flowMaxBitRateRoutes.getRoutes());
    this.route.use(flowAvgBitRateRoutes.getRoutes());
    this.route.use(flowMediaStorageRoutes.getRoutes());
  }

  private buildNextPageUrl(
    req: ValidatedRequest<QSSchema<GetFlowsQueryParamsRequest>>,
    nextPageToken: string,
  ): string {
    const url = new URL(`${req.protocol}://${req.host}${req.originalUrl}`);
    url.searchParams.set("page", nextPageToken);
    return url.toString();
  }

  private async listFlows(
    req: ValidatedRequest<QSSchema<GetFlowsQueryParamsRequest>>,
    res: Response<Flow[]>,
  ) {
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
    try {
      const list = await this.repository.listFlows({
        sourceId: req.query.source_id,
        timerange: parseTimerange(req.query.timerange),
        flowFormat: req.query.format,
        codec: req.query.codec,
        label: req.query.label,
        frameWidth: req.query.frame_width,
        frameHeight: req.query.frame_height,
        limit: req.query.limit,
        pageToken: req.query.page,
        tags,
        haveTags,
        doesNotHaveTags,
      });
      if (list.limit !== undefined)
        res.header("X-Paging-Limit", list.limit.toString());
      if (list.nextPageToken !== undefined) {
        res.header("X-Paging-NextKey", list.nextPageToken);
        res.header(
          "Link",
          `<${this.buildNextPageUrl(req, list.nextPageToken)}>; rel="next"`,
        );
      }
      res.json(list.flows.map((flow) => FlowAdapter.toApi(flow)));
    } catch (e) {
      if (e instanceof InvalidPageTokenError) {
        throw new BadRequestHttpError(e.message);
      }
      throw e;
    }
  }

  private async getFlow(
    req: ValidatedRequest<
      ParamsQSSchema<GetFlowPathParams, GetFlowQueryParamsRequest>
    >,
    res: Response<Flow>,
  ) {
    const flow = await this.repository.getFlowById(req.params.flowId);
    if (flow === null) throw new NotFoundHttpError("Flow could not be found");

    let apiFlow = FlowAdapter.toApi(flow);

    if (req.query.timerange && apiFlow.timerange) {
      const queryInterval = parseTimerange(req.query.timerange);
      const flowInterval = parseTimerange(apiFlow.timerange);

      if (queryInterval && flowInterval) {
        const intersection = intersectTimeranges(queryInterval, flowInterval);
        if (intersection) {
          apiFlow = { ...apiFlow, timerange: formatTimerange(intersection) };
        } else {
          apiFlow = { ...apiFlow, timerange: undefined };
        }
      }
    }

    if (req.query.include_timerange === false) {
      const { timerange, ...flowWithoutTimerange } = apiFlow;
      res.json(flowWithoutTimerange);
    } else {
      res.json(apiFlow);
    }
  }

  private async putFlow(
    req: ValidatedRequest<ParamsBodySchema<PutFlowPathParams, Flow>>,
    res: Response<Flow>,
  ) {
    if (req.params.flowId !== req.body.id) {
      throw new BadRequestHttpError("flow ID does not match URL parameter");
    }
    const currentFlow = await this.repository.getFlowById(req.params.flowId);
    const flowToPut = FlowAdapter.fromApi(req.body);
    const now = new Date();

    // protect readonly flow
    if (
      currentFlow?.readOnly === true &&
      (flowToPut.readOnly === true || flowToPut.readOnly === undefined)
    ) {
      throw new ForbiddenHttpError("Flow is in read only mode");
    }

    // updated readonly fields
    flowToPut.created = currentFlow?.created || now;
    flowToPut.metadataUpdated = now;
    flowToPut.segmentDuration = currentFlow?.segmentDuration || undefined;
    flowToPut.generation = currentFlow?.generation || undefined;

    const flow = await this.repository.putFlow(flowToPut);
    res.json(FlowAdapter.toApi(flow));
  }
}
