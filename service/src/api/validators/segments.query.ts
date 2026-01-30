import Joi from "joi";
import type {
  DeleteSegmentsQueryParams,
  ListSegmentsQueryParams,
} from "../models/segments.query";
import { timerangeValidator } from "./timerange";

export const listSegmentsQueryParamsValidator =
  Joi.object<ListSegmentsQueryParams>({
    object_id: Joi.string(),
    timerange: timerangeValidator,
    limit: Joi.number().integer().min(1).max(50).default(50),
    page: Joi.string(),
    reverse_order: Joi.boolean().default(false),
    include_object_timerange: Joi.boolean().default(false),
    verbose_storage: Joi.boolean().default(false),
    accept_get_urls: Joi.string(),
    accept_storage_ids: Joi.string(),
    presigned: Joi.boolean(),
  });

export const deleteSegmentsQueryParamsValidator =
  Joi.object<DeleteSegmentsQueryParams>({
    timerange: timerangeValidator.default("_"),
    object_id: Joi.string(),
  });
