import { Response } from 'express';
import {
    DeleteFlowLabelPathParams,
    deleteFlowLabelPathParamsValidator,
    flowLabelValidator,
    GetFlowLabelPathParams,
    getFlowLabelPathParamsValidator,
    PutFlowLabelPathParams,
    putFlowLabelPathParamsValidator,

} from '@tams-k8s/api';
import { ValidatedRequest } from 'express-joi-validation';
import { BackendManager } from '../backend/manager';
import { RepositoriesBuilder } from '../repository/builder';
import { Factory } from '../repository/factory';
import { Routes } from './generic';
import { ForbiddenHttpError, NotFoundHttpError, ParamsBodySchema, ParamsSchema, validator } from './middlewares';

export class FlowsLabel extends Routes {
    constructor(repositories: Factory, backends: BackendManager) {
        super(repositories, backends);

        this.route.get<any, string>(
            '/:flowId/label',
            validator.params(getFlowLabelPathParamsValidator),
            validator.response(flowLabelValidator),
            this.getFlowLabel.bind(this),
        );
        this.route.put<any, void, string>(
            '/:flowId/label',
            validator.params(putFlowLabelPathParamsValidator),
            validator.body(flowLabelValidator.required()),
            this.putFlowLabel.bind(this),
        );
        this.route.delete<any, void>(
            '/:flowId/label',
            validator.params(deleteFlowLabelPathParamsValidator),
            this.deleteFlowLabel.bind(this),
        );
    }

    async getFlowLabel(req: ValidatedRequest<ParamsSchema<GetFlowLabelPathParams>>, res: Response<string>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        res.json(flow?.label)
    }

    async putFlowLabel(req: ValidatedRequest<ParamsBodySchema<PutFlowLabelPathParams, string>>, res: Response<void>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.metadataUpdated = new Date();
        flow.label = req.body;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }

    async deleteFlowLabel(req: ValidatedRequest<ParamsSchema<DeleteFlowLabelPathParams>>, res: Response<void>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.metadataUpdated = new Date();
        flow.label = undefined;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }
}
