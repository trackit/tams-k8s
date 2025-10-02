import { Request, Response, NextFunction } from "express";
import { createValidator } from "express-joi-validation";

export const validator = createValidator({ passError: true });

export const validationErrorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err && err.error && err.error.isJoi) {
        res.status(400).json({
            type: err.type,
            message: err.error.toString()
        });
    } else {
        next(err);
    }
}
