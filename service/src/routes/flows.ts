import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import {
    DeleteFlowTagPathParams,
    Flow,
    FlowTags,
    GetFlowPathParams,
    GetFlowQueryParamsRequest,
    GetFlowsQueryParamsRequest,
    GetFlowTagPathParams,
    GetFlowTagsPathParams,
    PutFlowPathParams,
    PutFlowTagPathParams,
    flowsValidator,
    flowTagsValidator,
    flowTagValidator,
    flowValidator,
    getFlowPathParamsValidator,
    getFlowTagPathParamsValidator,
    getFlowTagsPathParamsValidator,
    listFlowsQueryParamsValidator,
    putFlowPathParamsValidator,
    putFlowTagPathParamsValidator,
    deleteFlowTagPathParamsValidator,
} from '@tams-k8s/api';
import { BackendManager } from "../backend/manager";
import { FlowAdapter } from "../repository/adapters/flow.adapter";
import { RepositoriesBuilder } from "../repository/builder";
import { BadRequestHttpError, ForbiddenHttpError, NotFoundHttpError } from "./middlewares/errorHelper";
import { Routes } from "./generic";
import { ParamsBodySchema, ParamsQSSchema, ParamsSchema, QSSchema, validator } from "./middlewares/validationHelper";

export class FlowsRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get(
            '/',
            validator.query(listFlowsQueryParamsValidator),
            validator.response(flowsValidator),
            this.listFlows.bind(this),
        );
        this.route.get<any, Flow>(
            '/:flowId',
            validator.params(getFlowPathParamsValidator),
            validator.response(flowValidator.required()),
            this.getFlow.bind(this)
        );
        this.route.put<any, Flow>(
            '/:flowId',
            validator.params(putFlowPathParamsValidator),
            validator.body(flowValidator.required()),
            validator.response(flowValidator.required()),
            this.putFlow.bind(this),
        );
        this.route.get<any, FlowTags>(
            '/:flowId/tags',
            validator.params(getFlowTagsPathParamsValidator),
            validator.response(flowTagsValidator.required()),
            this.getFlowTags.bind(this),
        );
        this.route.get<any, string>(
            '/:flowId/tags/:name',
            validator.params(getFlowTagPathParamsValidator),
            validator.response(flowTagValidator.required()),
            this.getFlowTag.bind(this),
        );
        this.route.put<any, void>(
            '/:flowId/tags/:name',
            validator.params(putFlowTagPathParamsValidator),
            validator.body(flowTagValidator.required()),
            this.putFlowTag.bind(this),
        );
        this.route.delete<any, void>(
            '/:flowId/tags/:name',
            validator.params(deleteFlowTagPathParamsValidator),
            this.deleteFlowTag.bind(this),
        )
    }

    private async listFlows(req: ValidatedRequest<QSSchema<GetFlowsQueryParamsRequest>>, res: Response<Flow[]>) {
        const flowRepo = this.repositories.getFlowRepository();
        const tags: Record<string, string> = {};
        const haveTags: string[] = [];
        const doesNotHaveTags: string[] = [];
        Object.entries(req.query).forEach(([key, value]) => {
            if (key.startsWith('tag_exists.')) {
                if (value) {
                    haveTags.push(key.replace('tag_exists.', ''));
                } else {
                    doesNotHaveTags.push(key.replace('tag_exists.', ''));
                }
            }
            if (key.startsWith('tag.') && typeof value === 'string') {
                tags[key.replace('tag.', '')] = value;
            }
        })
        const flows = await flowRepo.listFlows({
            sourceId: req.query.source_id,
            timerange: req.query.timerange,
            flowFormat: req.query.format,
            codec: req.query.codec,
            label: req.query.label,
            frameWidth: req.query.frame_width,
            frameHeight: req.query.frame_height,
            tags,
            haveTags,
            doesNotHaveTags
        });
        res.json(flows.map((flow) => (FlowAdapter.toApi(flow))));
    }

    private async getFlow(req: ValidatedRequest<ParamsQSSchema<GetFlowPathParams, GetFlowQueryParamsRequest>>, res: Response<Flow>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError('Flow could not be found');
        res.json(FlowAdapter.toApi(flow));
    }

    private async putFlow(req: ValidatedRequest<ParamsBodySchema<PutFlowPathParams, Flow>>, res: Response<Flow>) {
        if (req.params.flowId !== req.body.id) {
            throw new BadRequestHttpError( 'flow ID does not match URL parameter');
        }
        const flowRepository = this.repositories.getFlowRepository();
        const currentFlow = await flowRepository.getFlowById(req.params.flowId);
        const flowToPut = FlowAdapter.fromApi(req.body);
        const now = new Date();

        // protect readonly flow
        if (currentFlow?.readOnly === true && (flowToPut.readOnly === true || flowToPut.readOnly === undefined)) {
            throw new ForbiddenHttpError('Flow is in read only mode');
        }

        // updated readonly fields
        flowToPut.created = currentFlow?.created || now;
        flowToPut.metadataUpdated = now;
        flowToPut.segmentDuration = currentFlow?.segmentDuration || undefined;
        flowToPut.generation = currentFlow?.generation || undefined;

        const flow = await flowRepository.putFlow(flowToPut);
        res.json(FlowAdapter.toApi(flow));
    }

    private async getFlowTags(req: ValidatedRequest<ParamsSchema<GetFlowTagsPathParams>>, res: Response<FlowTags>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError('Flow could not be found');
        res.json(flow.tags);
    }

    private async getFlowTag(req: ValidatedRequest<ParamsSchema<GetFlowTagPathParams>>, res: Response<string>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.tags?.[req.params.name] === undefined) throw new NotFoundHttpError(`Tag "${req.params.name}" could not be found`);
        res.json(flow.tags[req.params.name]);
    }

    private async putFlowTag(req: ValidatedRequest<ParamsBodySchema<PutFlowTagPathParams, string>>, res: Response<void>) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        flow.tags = flow.tags || {};
        flow.tags[req.params.name] = req.body;
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }

    private async deleteFlowTag(req: ValidatedRequest<ParamsSchema<DeleteFlowTagPathParams>>, res: Response) {
        const flowRepository = this.repositories.getFlowRepository();
        const flow = await flowRepository.getFlowById(req.params.flowId);
        if (flow === null) throw new NotFoundHttpError(`Flow "${req.params.flowId}" could not be found`);
        if (flow.readOnly === true) throw new ForbiddenHttpError('Flow is in read only mode');
        if (flow.tags?.[req.params.name] === undefined) throw new NotFoundHttpError(`Tag "${req.params.name}" could not be found`);
        delete flow.tags[req.params.name];
        await flowRepository.putFlow(flow);
        res.sendStatus(204);
    }
}
