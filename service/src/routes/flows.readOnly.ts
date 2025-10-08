import { Response } from 'express';
import {
    flowReadOnlyValidator,
    GetFlowReadOnlyPathParams,
    getFlowReadOnlyPathParamsValidator,
    PutFlowReadOnlyPathParams,
    putFlowReadOnlyPathParamsValidator,

} from '@tams-k8s/api';
import { ValidatedRequest } from 'express-joi-validation';
import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';
import { Routes } from './generic';
import { NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from './middlewares';

export class FlowsReadOnly extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get<any, boolean>(
            '/:flowId/read_only',
            validator.params(getFlowReadOnlyPathParamsValidator),
            validator.response(flowReadOnlyValidator),
            this.getFlowReadOnly.bind(this),
        );
        this.route.put<any, void, boolean>(
            '/:flowId/read_only',
            validator.params(putFlowReadOnlyPathParamsValidator),
            validator.body(flowReadOnlyValidator.required()),
            this.putFlowReadOnly.bind(this),
        );
    }

    async getFlowReadOnly(req: ValidatedRequest<ParamsSchema<GetFlowReadOnlyPathParams>>, res: Response<boolean>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        res.json(flow.readOnly === true);
    }

    async putFlowReadOnly(req: ValidatedRequest<ParamsBodySchema<PutFlowReadOnlyPathParams, boolean>>, res: Response<void>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        flow.metadataUpdated = new Date();
        flow.readOnly = req.body === true ? true : undefined;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }
}
