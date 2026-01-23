import Joi from 'joi';
import { FormatUrn, GetFlowQueryParamsRequest, GetFlowsQueryParamsRequest } from '@tams-k8s/api';
import { codecValidator } from './codec';
import { timerangeValidator } from './timerange';

export const listFlowsQueryParamsValidator = Joi.object<GetFlowsQueryParamsRequest>({
    source_id: Joi.string().uuid(),
    timerange: timerangeValidator.default('_'),
    format: Joi.string().valid(...Object.values(FormatUrn)),
    codec: codecValidator,
    label: Joi.string(),
    frame_width: Joi.number(),
    frame_height: Joi.number(),
    page: Joi.string(),
    limit: Joi.number().min(1).max(50).default(50),
}).pattern(/^tag\..+$/, Joi.string()).pattern(/^tag_exists\..+$/, Joi.boolean());

export const getFlowQueryParamsValidator = Joi.object<GetFlowQueryParamsRequest>({
    include_timerange: Joi.boolean(),
    timerange: timerangeValidator,
});
