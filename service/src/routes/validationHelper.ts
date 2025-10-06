import { Request, Response, NextFunction } from "express";
import { ContainerTypes, createValidator, ValidatedRequestSchema } from "express-joi-validation";
import { log } from '@tams-k8s/logger';

export const validator = createValidator({ passError: true });

export const validationHelper = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err && err.error && err.error.isJoi) {
        if (err.type === 'response') {
            log.error('Response validation error', { error: err.error, details: err.error.details });
            res
                .status(500)
                .header({ 'Content-Type': 'application/json' })
                .send(JSON.stringify({ message: 'response validation error' }));
        } else {
            res
                .status(400)
                .header({ 'Content-Type': 'application/json' })
                .send(JSON.stringify({
                    type: 'validation_error',
                    where: err.type,
                    message: err.error.toString()
                }));
        }
    } else {
        next(err);
    }
}

export interface BodySchema<T> extends ValidatedRequestSchema {
    [ContainerTypes.Body]: T
}

export interface ParamsBodySchema<Params, Body> extends ValidatedRequestSchema {
    [ContainerTypes.Params]: Params
    [ContainerTypes.Body]: Body
}

export interface QSSchema<T> extends ValidatedRequestSchema {
    [ContainerTypes.Query]: T
}
