import Joi from "joi";

export const codecRegex = /^(application|audio|font|example|image|message|model|multipart|text|video|x-[0-9A-Za-z!#$%&'*+.^_`|~-]+)\/([0-9A-Za-z!#$%&'*+.^_`|~-]+)$/;

export const codecValidator = Joi.string().regex(codecRegex);
