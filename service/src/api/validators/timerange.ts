import Joi from "joi";

export const timerangeRegex = /^([\[(])?(-?(0|[1-9][0-9]*):(0|[1-9][0-9]{0,8}))?(_(-?(0|[1-9][0-9]*):(0|[1-9][0-9]{0,8}))?)?([\])])?$/;

export const timerangeValidator = Joi.string().regex(timerangeRegex);
