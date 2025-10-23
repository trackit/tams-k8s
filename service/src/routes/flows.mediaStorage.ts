import { Response } from 'express';
import {
    MediaBucketObjectStore,
    PostFlowMediaStoragePathParams,
    postFlowMediaStoragePathParamsValidator,
    PostFlowMediaStorageRequest,
    postFlowMediaStorageRequestValidator,
} from '@tams-k8s/api';
import { ValidatedRequest } from 'express-joi-validation';
import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';
import { Routes } from './generic';
import { BadRequestHttpError, ParamsBodySchema, validator } from './middlewares';

export class FlowMediaStorageRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.post<any, MediaBucketObjectStore>(
            '/:flowId/storage',
            validator.params(postFlowMediaStoragePathParamsValidator),
            validator.body(postFlowMediaStorageRequestValidator),
            this.postMediaStorage.bind(this));
    }

    private async postMediaStorage(req: ValidatedRequest<ParamsBodySchema<PostFlowMediaStoragePathParams, PostFlowMediaStorageRequest>>, res: Response<MediaBucketObjectStore>) {
        req.body = req.body ?? {};
        if (req.body.limit !== undefined && req.body.object_ids !== undefined) {
            throw new BadRequestHttpError('Cannot set both limit and object_ids.');
        }
        const backend = req.body.storage_id !== undefined ? this.backends.getBackendById(req.body.storage_id) : this.backends.getDefaultBackend();
        if (backend === null) {
            throw new BadRequestHttpError('Storage backend not found.');
        }
        if (req.body.limit === undefined && req.body.object_ids === undefined) {
            req.body.limit = 50;
        }
        res.sendStatus(204);
    }
}