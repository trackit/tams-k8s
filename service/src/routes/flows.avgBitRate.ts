import { Response } from 'express';
import {
    getFlowAvgBitRatePathParamsValidator,
    flowAvgBitRateValidator,
    putFlowAvgBitRatePathParamsValidator,
    GetFlowAvgBitRatePathParams,
    PutFlowAvgBitRatePathParams,
    deleteFlowAvgBitRatePathParamsValidator,
    DeleteFlowAvgBitRatePathParams,
} from '@tams-k8s/api';
import { ValidatedRequest } from 'express-joi-validation';
import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';
import { Routes } from './generic';
import { ForbiddenHttpError, NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from './middlewares';

export class FlowsAvgBitRate extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get<any, number>(
            '/:flowId/avg_bit_rate',
            validator.params(getFlowAvgBitRatePathParamsValidator),
            validator.response(flowAvgBitRateValidator),
            this.getFlowAvgBitRate.bind(this),
        );
        this.route.put<any, void, number>(
            '/:flowId/avg_bit_rate',
            validator.params(putFlowAvgBitRatePathParamsValidator),
            validator.body(flowAvgBitRateValidator.required()),
            this.putFlowAvgBitRate.bind(this),
        );
        this.route.delete<any, void>(
            '/:flowId/avg_bit_rate',
            validator.params(deleteFlowAvgBitRatePathParamsValidator),
            this.deleteFlowAvgBitRate.bind(this),
        );
    }

    async getFlowAvgBitRate(req: ValidatedRequest<ParamsSchema<GetFlowAvgBitRatePathParams>>, res: Response<number>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        res.json(flow?.avgBitRate);
    }

    async putFlowAvgBitRate(req: ValidatedRequest<ParamsBodySchema<PutFlowAvgBitRatePathParams, number>>, res: Response<void>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.metadataUpdated = new Date();
        flow.avgBitRate = req.body;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }

    async deleteFlowAvgBitRate(req: ValidatedRequest<ParamsSchema<DeleteFlowAvgBitRatePathParams>>, res: Response<void>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.metadataUpdated = new Date();
        flow.avgBitRate = undefined;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }
}
