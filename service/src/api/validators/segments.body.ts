import Joi from "joi";
import type { GetUrl, Segment } from "../models/segments.body";
import { timerangeValidator } from "./timerange";
import { timestampValidator } from "./timestamp";

const getUrlValidator = Joi.object<GetUrl>({
  storage_id: Joi.string().uuid(),
  url: Joi.string().uri().required(),
  presigned: Joi.boolean(),
  label: Joi.string(),
  controlled: Joi.boolean(),
});

export const segmentValidator = Joi.object<Segment>({
  object_id: Joi.string().required(),
  timerange: timerangeValidator.required(),
  ts_offset: timestampValidator,
  last_duration: timestampValidator,
  object_timerange: timerangeValidator,
  sample_offset: Joi.number().integer().min(0), // deprecated
  sample_count: Joi.number().integer().min(0), // deprecated
  get_urls: Joi.array().items(getUrlValidator),
  key_frame_count: Joi.number().integer().min(0),
});

export const segmentOrArrayValidator = Joi.alternatives().try(
  segmentValidator,
  Joi.array().items(segmentValidator).min(1)
);
