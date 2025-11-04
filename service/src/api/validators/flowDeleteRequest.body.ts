import Joi from "joi";
import { FlowDeleteRequest, FlowDeleteRequestStatus } from "@tams-k8s/api";
import { timerangeValidator } from "./timerange";

export const flowDeleteRequestValidator = Joi.object<FlowDeleteRequest>({
  id: Joi.string().uuid().required(),
  flow_id: Joi.string().uuid(),
  timerange: timerangeValidator.required(),
  status: Joi.string()
    .valid(...Object.values(FlowDeleteRequestStatus))
    .required(),
  progress: Joi.number().min(0).max(100),
  created: Joi.date(),
  updated: Joi.date(),
  error_message: Joi.string(),
  metadata: Joi.object().pattern(Joi.string(), Joi.any()),
});

export const flowDeleteRequestsValidator = Joi.array().items(flowDeleteRequestValidator);
