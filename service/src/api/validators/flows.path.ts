import Joi from 'joi';
import {
    DeleteFlowDescriptionPathParams,
    DeleteFlowFlowCollectionPathParams,
    DeleteFlowLabelPathParams,
    DeleteFlowMaxBitRatePathParams,
    DeleteFlowTagPathParams,
    GetFlowDescriptionPathParams,
    GetFlowFlowCollectionPathParams,
    GetFlowLabelPathParams,
    GetFlowMaxBitRatePathParams,
    GetFlowPathParams,
    GetFlowReadOnlyPathParams,
    GetFlowTagPathParams,
    GetFlowTagsPathParams,
    PutFlowDescriptionPathParams,
    PutFlowFlowCollectionPathParams,
    PutFlowLabelPathParams,
    PutFlowMaxBitRatePathParams,
    PutFlowPathParams,
    PutFlowReadOnlyPathParams,
    PutFlowTagPathParams,
} from '@tams-k8s/api';

export const putFlowPathParamsValidator = Joi.object<PutFlowPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const getFlowPathParamsValidator = Joi.object<GetFlowPathParams>({
    flowId: Joi.string().uuid().required(),
});

// Tags
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

// Description
export const getFlowDescriptionPathParamsValidator = Joi.object<GetFlowDescriptionPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const putFlowDescriptionPathParamsValidator = Joi.object<PutFlowDescriptionPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const deleteFlowDescriptionPathParamsValidator = Joi.object<DeleteFlowDescriptionPathParams>({
    flowId: Joi.string().uuid().required(),
});

// Label
export const getFlowLabelPathParamsValidator = Joi.object<GetFlowLabelPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const putFlowLabelPathParamsValidator = Joi.object<PutFlowLabelPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const deleteFlowLabelPathParamsValidator = Joi.object<DeleteFlowLabelPathParams>({
    flowId: Joi.string().uuid().required(),
});

// Read Only
export const getFlowReadOnlyPathParamsValidator = Joi.object<GetFlowReadOnlyPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const putFlowReadOnlyPathParamsValidator = Joi.object<PutFlowReadOnlyPathParams>({
    flowId: Joi.string().uuid().required(),
});

// Flow collection
export const getFlowFlowCollectionPathParamsValidator = Joi.object<GetFlowFlowCollectionPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const putFlowFlowCollectionPathParamsValidator = Joi.object<PutFlowFlowCollectionPathParams>({
    flowId: Joi.string().uuid().required(),
});

export const deleteFlowFlowCollectionPathParamsValidator = Joi.object<DeleteFlowFlowCollectionPathParams>({
    flowId: Joi.string().uuid().required(),
});

// Max bit rate
export const getFlowMaxBitRatePathParamsValidator = Joi.object<GetFlowMaxBitRatePathParams>({
    flowId: Joi.string().uuid().required(),
});

export const putFlowMaxBitRatePathParamsValidator = Joi.object<PutFlowMaxBitRatePathParams>({
    flowId: Joi.string().uuid().required(),
});

export const deleteFlowMaxBitRatePathParamsValidator = Joi.object<DeleteFlowMaxBitRatePathParams>({
    flowId: Joi.string().uuid().required(),
});
