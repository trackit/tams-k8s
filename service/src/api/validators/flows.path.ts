import { GetFlowPathParams, GetFlowTagsPathParams, PutFlowPathParams } from "@tams-k8s/api";
import Joi from 'joi';

export const putFlowPathParamsValidator = Joi.object<PutFlowPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const getFlowPathParamsValidator = Joi.object<GetFlowPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const getFlowTagsPathParamsValidator = Joi.object<GetFlowTagsPathParams>({
    flowId: Joi.string().uuid().required(),
});
