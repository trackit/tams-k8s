import Joi from "joi";
import { Source, SourceCollectionItem, FormatUrn } from "@tams-k8s/api";

export const sourceCollectionItemValidator = Joi.object<SourceCollectionItem>({
  id: Joi.string().uuid().required(),
  role: Joi.string().required(),
});

export const sourceTagsValidator = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string()))
);

export const sourceTagValidator = Joi.alternatives().try(
  Joi.string(),
  Joi.array().items(Joi.string())
);

export const sourceTagBodyValidator = Joi.object({
  value: Joi.string().required(),
});

export const sourceValidator = Joi.object<Source>({
  id: Joi.string().uuid().required(),
  format: Joi.string()
    .valid(...Object.values(FormatUrn))
    .required(),
  label: Joi.string(),
  description: Joi.string(),
  created_by: Joi.string(),
  updated_by: Joi.string(),
  created: Joi.date(),
  updated: Joi.date(),
  tags: sourceTagsValidator,
  source_collection: Joi.array().items(sourceCollectionItemValidator),
  collected_by: Joi.array().items(Joi.string()),
});

export const sourcesValidator = Joi.array().items(sourceValidator);

export const sourceDescriptionValidator = Joi.string();

export const sourceDescriptionBodyValidator = Joi.object({
  value: Joi.string().required(),
});

export const sourceLabelValidator = Joi.string();

export const sourceLabelBodyValidator = Joi.object({
  value: Joi.string().required(),
});
