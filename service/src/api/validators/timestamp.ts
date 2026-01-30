import Joi from 'joi';

export const timestampRegex = /^-?(0|[1-9][0-9]*):(0|[1-9][0-9]{0,8})$/;

export const timestampValidator = Joi.string().regex(timestampRegex);