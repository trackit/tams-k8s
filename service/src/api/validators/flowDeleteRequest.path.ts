import Joi from "joi";
import { GetFlowDeleteRequestsPathParams } from "@tams-k8s/api";

export const getFlowDeleteRequestsPathParamsValidator = Joi.object<GetFlowDeleteRequestsPathParams>(
  {
    requestId: Joi.string().uuid().required(),
  },
);
