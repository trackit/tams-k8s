import { Response } from "express";
import {
  MediaBucketObjectStore,
  MediaBucketObjectStoreItem,
  PostFlowMediaStoragePathParams,
  postFlowMediaStoragePathParamsValidator,
  PostFlowMediaStorageRequest,
  postFlowMediaStorageRequestValidator,
} from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { v4 as uuid } from "uuid";
import { Backend } from "../backend/backend";
import { backendManagerToken } from "../backend/manager";
import { Routes } from "./generic";
import {
  BadRequestHttpError,
  ForbiddenHttpError,
  NotFoundHttpError,
  ParamsBodySchema,
  validator,
} from "./middlewares";
import { inject } from "../di";
import { flowRepositoryToken, mediaObjectRepositoryToken } from "../repository";

const PRE_SIGNED_URL_EXPIRY = 3600;

export class FlowMediaStorageRoutes extends Routes {
  private readonly flowRepository = inject(flowRepositoryToken);
  private readonly mediaObjectRepository = inject(mediaObjectRepositoryToken);
  private readonly backendManager = inject(backendManagerToken);

  constructor() {
    super();

    this.route.post<any, MediaBucketObjectStore>(
      "/:flowId/storage",
      validator.params(postFlowMediaStoragePathParamsValidator),
      validator.body(postFlowMediaStorageRequestValidator),
      this.postMediaStorage.bind(this)
    );
  }

  private async generateMediaBucketObjectStore(
    contentType: string,
    backend: Backend,
    objectId: string
  ): Promise<MediaBucketObjectStoreItem> {
    return {
      object_id: objectId,
      put_url: {
        url: await backend.getPresignedUrl("PUT", objectId, {
          expiresIn: PRE_SIGNED_URL_EXPIRY,
          contentType,
        }),
        "content-type": contentType,
      },
    };
  }

  private async postMediaStorage(
    req: ValidatedRequest<
      ParamsBodySchema<
        PostFlowMediaStoragePathParams,
        PostFlowMediaStorageRequest
      >
    >,
    res: Response<MediaBucketObjectStore>
  ) {
    req.body = req.body ?? {};
    if (req.body.limit !== undefined && req.body.object_ids !== undefined) {
      throw new BadRequestHttpError("Cannot set both limit and object_ids.");
    }
    const backend =
      req.body.storage_id !== undefined
        ? this.backendManager.getBackendById(req.body.storage_id)
        : this.backendManager.getDefaultBackend();
    if (backend === null) {
      throw new BadRequestHttpError("Storage backend not found.");
    }
    if (req.body.limit === undefined && req.body.object_ids === undefined) {
      req.body.limit = 50;
    }
    if (req.body.object_ids !== undefined) {
      const hasObjectIds = await Promise.all(
        req.body.object_ids.map(
          async (objectId: string) =>
            (await this.mediaObjectRepository.getMediaObjectById(objectId)) !==
            null
        )
      );
      if (hasObjectIds.some((exists) => exists)) {
        throw new BadRequestHttpError("Some or all object ids already exists.");
      }
    }
    const flow = await this.flowRepository.getFlowById(req.params.flowId);
    if (flow === null)
      throw new NotFoundHttpError(
        `Flow "${req.params.flowId}" could not be found`
      );
    if (flow.readOnly === true)
      throw new ForbiddenHttpError("Flow is in read only mode");
    const container = flow.container;
    if (container === undefined)
      throw new BadRequestHttpError(
        "Invalid flow storage request JSON or the flow 'container' is not set."
      );
    const objects = await Promise.all(
      (
        req.body.object_ids ?? new Array(req.body.limit ?? 50).fill(undefined)
      ).map((requestedObjectId: string | undefined) => {
        let objectId = requestedObjectId ?? uuid();
        return this.generateMediaBucketObjectStore(
          container,
          backend,
          objectId
        );
      })
    );
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + PRE_SIGNED_URL_EXPIRY);
    await Promise.all(
      objects.map(async (object: MediaBucketObjectStoreItem) =>
        this.mediaObjectRepository.putMediaObject({
          objectId: object.object_id,
          expiresAt,
          storageId: backend.getId(),
          flowId: req.params.flowId,
        })
      )
    );
    res.status(201).json({
      media_objects: objects,
    });
  }
}
