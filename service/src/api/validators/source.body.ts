import Joi from "joi";
import { Source, SourceCollectionItem } from "../models/source.body";
import { FormatUrn } from "../models/commun.body";

export const sourceCollectionItemValidator = Joi.object<SourceCollectionItem>({
  id: Joi.string().uuid().required(),
  role: Joi.string().required(),
});

export const sourceValidator = Joi.object<Source>({
  id: Joi.string().uuid().required(),
  format: Joi.string()
    .valid(...Object.values(FormatUrn))
    .required(),

  label: Joi.string(),
  description: Joi.string(),
  tags: Joi.object().pattern(Joi.string(), Joi.string()),
  created: Joi.date(),
  updated: Joi.date(),
  created_by: Joi.string(),
  updated_by: Joi.string(),
  source_collection: Joi.array().items(sourceCollectionItemValidator),
});

export const sourcesValidator = Joi.array().items(sourceValidator);

export const sourceTagsValidator = Joi.object().pattern(
  Joi.string(),
  Joi.string()
);
