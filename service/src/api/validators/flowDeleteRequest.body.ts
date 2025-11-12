import Joi from "joi";
import { ErrorMetadata, FlowDeleteRequest, FlowDeleteRequestStatus } from "@tams-k8s/api";
import { timerangeValidator } from "./timerange";

export const ErrorMetadataValidator = Joi.object<ErrorMetadata>({
  type: Joi.string().required(),
  summary: Joi.string().required(),
  traceback: Joi.array().items(Joi.string()),
  time: Joi.date().required(),
});

export const flowDeleteRequestValidator = Joi.object<FlowDeleteRequest>({
  id: Joi.string().uuid().required(),
  flowId: Joi.string().uuid().required(),
  timerangeToDelete: timerangeValidator.required(),
  timerangeRemaining: timerangeValidator,
  deleteFlow: Joi.boolean().required(),
  progress: Joi.number().min(0).max(100),
  status: Joi.string()
    .valid(...Object.values(FlowDeleteRequestStatus))
    .required(),
  created: Joi.date(),
  createdBy: Joi.string(),
  updated: Joi.date(),
  expiry: Joi.date(),
  error: ErrorMetadataValidator,
});

export const flowDeleteRequestsValidator = Joi.array().items(flowDeleteRequestValidator);
