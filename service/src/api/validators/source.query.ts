import Joi from "joi";
import { SourceUrn, GetSourcesQueryParamsRequest } from "@tams-k8s/api";

export const listSourcesQueryParamsValidator =
  Joi.object<GetSourcesQueryParamsRequest>({
    label: Joi.string(),
    format: Joi.string().valid(...Object.values(SourceUrn)),
    page: Joi.string(),
    limit: Joi.number().integer().min(1),
  })
    .pattern(/^tag\..+$/, Joi.string())
    .pattern(/^tag_exists\..+$/, Joi.boolean());
