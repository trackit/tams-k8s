import { Request, Response, NextFunction } from "express";
import { ContainerTypes, createValidator, ValidatedRequestSchema } from "express-joi-validation";

export const validator = createValidator({ passError: true });

export const validationHelper = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err && err.error && err.error.isJoi) {
        res.status(400).json({
            type: 'validation_error',
            where: err.type,
            message: err.error.toString()
        });
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
