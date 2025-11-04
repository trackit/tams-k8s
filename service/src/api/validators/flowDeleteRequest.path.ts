import Joi from "joi";
import { HeadFlowDeleteRequestsPathParams, GetFlowDeleteRequestsPathParams } from "@tams-k8s/api";

export const headFlowDeleteRequestsPathParamsValidator = Joi.object<HeadFlowDeleteRequestsPathParams>({
  requestId: Joi.string().uuid().required(),
});

export const getFlowDeleteRequestsPathParamsValidator = Joi.object<GetFlowDeleteRequestsPathParams>({
  requestId: Joi.string().uuid().required(),
});
