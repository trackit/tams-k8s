import Joi from "joi";
import {
  PutSourcePathParams,
  PutSourceTagsPathParams,
  GetSourcePathParams,
  GetSourceTagsPathParams,
} from "../models/source.path";

export const putSourcePathParamsValidator = Joi.object<PutSourcePathParams>({
    sourceId: Joi.string().uuid().required(),
});

export const putSourceTagsPathParamsValidator = Joi.object<PutSourceTagsPathParams>({
    sourceId: Joi.string().uuid().required(),
    tagName: Joi.string().required(),
});

export const getSourcePathParamsValidator = Joi.object<GetSourcePathParams>({
    sourceId: Joi.string().uuid().required(),
});

export const getSourceTagsPathParamsValidator = Joi.object<GetSourceTagsPathParams>({
    sourceId: Joi.string().uuid().required(),
    tagName: Joi.string().required(),
});
