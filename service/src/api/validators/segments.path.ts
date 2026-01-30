import Joi from "joi";
import type { SegmentsPathParams } from "../models/segments.path";

export const segmentsPathParamsValidator = Joi.object<SegmentsPathParams>({
  flowId: Joi.string().uuid().required(),
});
