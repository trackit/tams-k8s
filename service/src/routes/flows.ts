import { Response } from "express";
import { FormatUrn, GetFlowsQueryParamsRequest, timerangeRegex, Flow } from "@tams-k8s/api";
import { ValidatedRequest } from "express-joi-validation";
import { BackendManager } from "../backend/manager";
import { RepositoriesBuilder } from "../repository/builder";
import { Routes } from "./generic";
import { QSSchema, validator } from "./validationHelper";
import Joi from "joi";

const listFlowsQueryParamsValidator = Joi.object<GetFlowsQueryParamsRequest>({
    source_id: Joi.string(),
    timerange: Joi.string().regex(timerangeRegex),
    format: Joi.string().valid(...Object.values(FormatUrn)),
    codec: Joi.string(),
    label: Joi.string(),
    frame_width: Joi.number(),
    frame_height: Joi.number(),
}).pattern(/^tag\..+$/, Joi.string()).pattern(/^tag_exists\..+$/, Joi.boolean());

export class FlowsRoutes extends Routes {
    constructor(repositories: RepositoriesBuilder, backends: BackendManager) {
        super(repositories, backends);

        this.route.get('/', validator.query(listFlowsQueryParamsValidator), this.listFlows.bind(this));
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
            source_id: flow.sourceId,
            label: flow.label,
            description: flow.description,
            created_by: flow.createdBy,
            updated_by: flow.updatedBy,
            tags: flow.tags,
        })));
    }
}
