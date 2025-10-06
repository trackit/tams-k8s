import Joi from "joi";
import { Response } from "express";
import { ValidatedRequest } from "express-joi-validation";
import { Flow, flowValidator, FormatUrn, GetFlowsQueryParamsRequest, timerangeRegex } from "@tams-k8s/api";
import { BackendManager } from "../backend/manager";
import { FlowAdapter } from "../repository/adapters/flow.adapter";
import { RepositoriesBuilder } from "../repository/builder";
import { BadRequestHttpError, HttpError } from "./errorHelper";
import { Routes } from "./generic";
import { ParamsBodySchema, QSSchema, validator } from "./validationHelper";

const listFlowsQueryParamsValidator = Joi.object<GetFlowsQueryParamsRequest>({
    source_id: Joi.string(),
    timerange: Joi.string().regex(timerangeRegex),
    format: Joi.string().valid(...Object.values(FormatUrn)),
    codec: Joi.string(),
    label: Joi.string(),
    frame_width: Joi.number(),
    frame_height: Joi.number(),
}).pattern(/^tag\..+$/, Joi.string()).pattern(/^tag_exists\..+$/, Joi.boolean());

interface PutFlowParams {
    flowId: string;
}
const putFlowsParamsValidator = Joi.object<PutFlowParams>({
    flowId: Joi.string().uuid().required(),
})

export class FlowsRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get('/', validator.query(listFlowsQueryParamsValidator), this.listFlows.bind(this));
        this.route.put<any, PutFlowParams>('/:flowId', validator.params(putFlowsParamsValidator), validator.body(flowValidator.required()), this.putFlow.bind(this));
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
        res.json(flows.map((flow) => ({
            id: flow.id,
            format: FormatUrn.VIDEO,
            codec: 'video/mp4',
            source_id: flow.sourceId,
            label: flow.label,
            description: flow.description,
            created_by: flow.createdBy,
            updated_by: flow.updatedBy,
            tags: flow.tags,
            essence_parameters: {
                frame_width: 1920,
                frame_height: 1080,
            }
        })));
    }

    private async putFlow(req: ValidatedRequest<ParamsBodySchema<PutFlowParams, Flow>>, res: Response) {
        if (req.params.flowId !== req.body.id) {
            throw new BadRequestHttpError( 'flow ID does not match URL parameter');
        }
        const flowRepo = this.repositories.getFlowRepository();
        // await flowRepo.putFlow(FlowAdapter.fromApi(req.body));
        console.log(FlowAdapter.fromApi(req.body));
        res.sendStatus(204);
    }
}
