import { Response } from 'express';
import {
    flowMaxBitRateValidator,
    getFlowMaxBitRatePathParamsValidator,
    putFlowMaxBitRatePathParamsValidator,
    deleteFlowMaxBitRatePathParamsValidator,
    GetFlowMaxBitRatePathParams,
    PutFlowMaxBitRatePathParams,
    DeleteFlowMaxBitRatePathParams,
} from '@tams-k8s/api';
import { ValidatedRequest } from 'express-joi-validation';
import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';
import { Routes } from './generic';
import { ForbiddenHttpError, NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from './middlewares';

export class FlowsMaxBitRate extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get<any, number>(
            '/:flowId/max_bit_rate',
            validator.params(getFlowMaxBitRatePathParamsValidator),
            validator.response(flowMaxBitRateValidator),
            this.getFlowMaxBitRate.bind(this),
        );
        this.route.put<any, void, number>(
            '/:flowId/max_bit_rate',
            validator.params(putFlowMaxBitRatePathParamsValidator),
            validator.body(flowMaxBitRateValidator.required()),
            this.putFlowMaxBitRate.bind(this),
        );
        this.route.delete<any, void>(
            '/:flowId/max_bit_rate',
            validator.params(deleteFlowMaxBitRatePathParamsValidator),
            this.deleteFlowMaxBitRate.bind(this),
        );
    }

    async getFlowMaxBitRate(req: ValidatedRequest<ParamsSchema<GetFlowMaxBitRatePathParams>>, res: Response<number>) {
        const flowRepository = this.repositories!.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        res.json(flow?.maxBitRate);
    }

    async putFlowMaxBitRate(req: ValidatedRequest<ParamsBodySchema<PutFlowMaxBitRatePathParams, number>>, res: Response<void>) {
        const flowRepository = this.repositories!.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.metadataUpdated = new Date();
        flow.maxBitRate = req.body;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }

    async deleteFlowMaxBitRate(req: ValidatedRequest<ParamsSchema<DeleteFlowMaxBitRatePathParams>>, res: Response<void>) {
        const flowRepository = this.repositories!.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.metadataUpdated = new Date();
        flow.maxBitRate = undefined;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }
}
