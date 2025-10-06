import { FormatUrn, GetFlowQueryParamsRequest, GetFlowsQueryParamsRequest } from "@tams-k8s/api";
import { timerangeValidator } from './timerange';
import Joi from "joi";

export const listFlowsQueryParamsValidator = Joi.object<GetFlowsQueryParamsRequest>({
    source_id: Joi.string(),
    timerange: timerangeValidator,
    format: Joi.string().valid(...Object.values(FormatUrn)),
    codec: Joi.string(),
    label: Joi.string(),
    frame_width: Joi.number(),
    frame_height: Joi.number(),
}).pattern(/^tag\..+$/, Joi.string()).pattern(/^tag_exists\..+$/, Joi.boolean());

export const getFlowQueryParamsValidator = Joi.object<GetFlowQueryParamsRequest>({
    include_timerange: Joi.boolean(),
    timerange: timerangeValidator,
});
