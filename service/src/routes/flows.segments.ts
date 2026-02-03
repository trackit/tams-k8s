import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
  DeleteSegmentsQueryParams,
  deleteSegmentsQueryParamsValidator,
  ListSegmentsQueryParams,
  listSegmentsQueryParamsValidator,
  Segment,
  SegmentBulkFailureResponse,
  segmentOrArrayValidator,
  SegmentsPathParams,
  segmentsPathParamsValidator,
} from "@tams-k8s/api";
import { Routes } from "./generic";
import {
  BadRequestHttpError,
  ForbiddenHttpError,
  NotFoundHttpError,
  ParamsBodySchema,
  ParamsQSSchema,
  validator,
} from "./middlewares";
import { inject } from "../di";
import { flowRepositoryToken, segmentRepositoryToken } from "../repository";
import { SegmentAdapter } from "../repository/adapters/segment.adapter";
import { InvalidPageTokenError } from "../repository/errors";

export class FlowsSegments extends Routes {
  private readonly segmentRepository = inject(segmentRepositoryToken);
  private readonly flowRepository = inject(flowRepositoryToken);

  constructor() {
    super();

    this.route.get<any, Segment[]>(
      "/:flowId/segments",
      validator.params(segmentsPathParamsValidator),
      validator.query(listSegmentsQueryParamsValidator),
      this.listSegments.bind(this)
    );

    this.route.post<any, void | SegmentBulkFailureResponse>(
      "/:flowId/segments",
      validator.params(segmentsPathParamsValidator),
      validator.body(segmentOrArrayValidator.required()),
      this.createSegments.bind(this)
    );

    this.route.delete<any, void>(
      "/:flowId/segments",
      validator.params(segmentsPathParamsValidator),
      validator.query(deleteSegmentsQueryParamsValidator),
      this.deleteSegments.bind(this)
    );
  }

  private buildNextPageUrl(
    req: ValidatedRequest<
      ParamsQSSchema<SegmentsPathParams, ListSegmentsQueryParams>
    >,
    nextPageToken: string
  ): string {
    const url = new URL(`${req.protocol}://${req.host}${req.originalUrl}`);
    url.searchParams.set('page', nextPageToken);
    return url.toString();
  }

  private async listSegments(
    req: ValidatedRequest<
      ParamsQSSchema<SegmentsPathParams, ListSegmentsQueryParams>
    >,
    res: Response<Segment[]>
  ) {
    const flow = await this.flowRepository.getFlowById(req.params.flowId);
    if (flow === null) {
      throw new NotFoundHttpError("Flow could not be found");
    }

    try {
      const listResult = await this.segmentRepository.listSegments({
        flowId: req.params.flowId,
        objectId: req.query.object_id,
        timerange: req.query.timerange,
        limit: req.query.limit,
        pageToken: req.query.page,
        reverseOrder: req.query.reverse_order,
        includeObjectTimerange: req.query.include_object_timerange,
        // TODO: Storage backend filtering parameters (not implemented)
        // These are validated but ignored for now
      });

      if (listResult.limit !== undefined) {
        res.header("X-Paging-Limit", listResult.limit.toString());
      }
      if (listResult.nextPageToken !== undefined) {
        res.header("X-Paging-NextKey", listResult.nextPageToken);
        res.header(
          "Link",
          `<${this.buildNextPageUrl(req, listResult.nextPageToken)}>; rel="next"`
        );
      }

      const apiSegments = listResult.segments.map((segment) =>
        SegmentAdapter.toApi(segment)
      );

      res.json(apiSegments);
    } catch (e) {
      if (e instanceof InvalidPageTokenError) {
        throw new BadRequestHttpError(e.message);
      }
      throw e;
    }
  }

  private async createSegments(
    req: ValidatedRequest<ParamsBodySchema<SegmentsPathParams, Segment | Segment[]>>,
    res: Response<void | SegmentBulkFailureResponse>
  ) {
    const flow = await this.flowRepository.getFlowById(req.params.flowId);
    if (flow === null) {
      throw new NotFoundHttpError("Flow could not be found");
    }

    if (flow.readOnly) {
      throw new ForbiddenHttpError("Cannot modify segments of read-only flow");
    }

    const segmentsToCreate: Segment[] = Array.isArray(req.body)
      ? req.body
      : [req.body];

    const repositorySegments = segmentsToCreate.map((apiSegment) =>
      SegmentAdapter.fromApi(apiSegment, req.params.flowId)
    );

    const result = await this.segmentRepository.createSegments(
      req.params.flowId,
      repositorySegments
    );

    if (!result.failed || result.failed.length === 0) {
      res.sendStatus(201);
      return;
    }

    const failureResponse: SegmentBulkFailureResponse = {
      failed_segments: result.failed.map((failure) => ({
        object_id: failure.objectId,
        timerange: failure.timerange,
        error: {
          code: 400,
          error: failure.error,
        },
      })),
    };

    res.status(200).json(failureResponse);
  }

  private async deleteSegments(
    req: ValidatedRequest<
      ParamsQSSchema<SegmentsPathParams, DeleteSegmentsQueryParams>
    >,
    res: Response<void>
  ) {
    const flow = await this.flowRepository.getFlowById(req.params.flowId);
    if (flow === null) {
      throw new NotFoundHttpError("Flow could not be found");
    }

    if (flow.readOnly) {
      throw new ForbiddenHttpError("Cannot modify segments of read-only flow");
    }

    await this.segmentRepository.deleteSegments(req.params.flowId, {
      flowId: req.params.flowId,
      timerange: req.query.timerange,
      objectId: req.query.object_id,
    });

    // TODO: Support async deletion (202 response) for long-running operations
    res.sendStatus(204);
  }
}
