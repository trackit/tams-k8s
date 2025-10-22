import Joi from "joi";
import { FormatUrn, GetSourcesQueryParamsRequest } from "@tams-k8s/api";

export const listSourcesQueryParamsValidator =
  Joi.object<GetSourcesQueryParamsRequest>({
    label: Joi.string(),
    format: Joi.string().valid(...Object.values(FormatUrn)),
    page: Joi.string(),
    limit: Joi.number().integer().min(1),
  })
    .pattern(/^tag\..+$/, Joi.string())
    .pattern(/^tag_exists\..+$/, Joi.boolean());
