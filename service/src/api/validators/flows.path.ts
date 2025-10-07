import Joi from 'joi';
import {
    DeleteFlowTagPathParams,
    GetFlowPathParams,
    GetFlowTagPathParams,
    GetFlowTagsPathParams,
    PutFlowPathParams,
    PutFlowTagPathParams,
} from "@tams-k8s/api";

export const putFlowPathParamsValidator = Joi.object<PutFlowPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const getFlowPathParamsValidator = Joi.object<GetFlowPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const getFlowTagsPathParamsValidator = Joi.object<GetFlowTagsPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const getFlowTagPathParamsValidator = Joi.object<GetFlowTagPathParams>({
    flowId: Joi.string().uuid().required(),
    name: Joi.string().required(),
});

export const putFlowTagPathParamsValidator = Joi.object<PutFlowTagPathParams>({
    flowId: Joi.string().uuid().required(),
    name: Joi.string().required(),
});

export const deleteFlowTagPathParamsValidator = Joi.object<DeleteFlowTagPathParams>({
    flowId: Joi.string().uuid().required(),
    name: Joi.string().required(),
});
