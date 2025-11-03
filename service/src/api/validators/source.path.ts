import Joi from "joi";
import {
  GetSourcePathParams,
  PutSourceTagPathParams,
  GetSourceTagsPathParams,
  DeleteSourceDescriptionPathParams,
  GetSourceDescriptionPathParams,
  PutSourceDescriptionPathParams,
  DeleteSourceLabelPathParams,
  GetSourceLabelPathParams,
  PutSourceLabelPathParams,
  DeleteSourceTagPathParams,
  GetSourceTagPathParams,
} from "@tams-k8s/api";

export const getSourcePathParamsValidator = Joi.object<GetSourcePathParams>({
  sourceId: Joi.string().uuid().required(),
});

// Tags
export const getSourceTagsPathParamsValidator = Joi.object<GetSourceTagsPathParams>({
  sourceId: Joi.string().uuid().required(),
});

export const getSourceTagPathParamsValidator = Joi.object<GetSourceTagPathParams>({
  sourceId: Joi.string().uuid().required(),
  name: Joi.string().required(),
});

export const putSourceTagPathParamsValidator = Joi.object<PutSourceTagPathParams>({
  sourceId: Joi.string().uuid().required(),
  name: Joi.string().required(),
});

export const deleteSourceTagPathParamsValidator = Joi.object<DeleteSourceTagPathParams>({
  sourceId: Joi.string().uuid().required(),
  name: Joi.string().required(),
});

// Description
export const headSourceDescriptionPathParamsValidator = Joi.object<GetSourceDescriptionPathParams>({
  sourceId: Joi.string().uuid().required(),
});

export const getSourceDescriptionPathParamsValidator = Joi.object<GetSourceDescriptionPathParams>({
  sourceId: Joi.string().uuid().required(),
});

export const putSourceDescriptionPathParamsValidator = Joi.object<PutSourceDescriptionPathParams>({
  sourceId: Joi.string().uuid().required(),
});

export const deleteSourceDescriptionPathParamsValidator =
  Joi.object<DeleteSourceDescriptionPathParams>({
    sourceId: Joi.string().uuid().required(),
  });

// Label
export const getSourceLabelPathParamsValidator = Joi.object<GetSourceLabelPathParams>({
  sourceId: Joi.string().uuid().required(),
});

export const putSourceLabelPathParamsValidator = Joi.object<PutSourceLabelPathParams>({
  sourceId: Joi.string().uuid().required(),
});

export const deleteSourceLabelPathParamsValidator = Joi.object<DeleteSourceLabelPathParams>({
  sourceId: Joi.string().uuid().required(),
});
