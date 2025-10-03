import { Request, Response, NextFunction } from "express";

export class HttpError extends Error {
    private readonly status: number;
    private readonly type: string;

    constructor(status: number, message: string, type: string = 'internal_error') {
        super(message);
        this.status = status;
        this.type = type;
    }
    get statusCode() {
        return this.status;
    }

    get errorType() {
        return this.type;
    }
}

export class BadRequestHttpError extends HttpError {
    constructor(message?: string) {
        super(400, message ? `Bad request: ${message}` : 'Bad request', 'bad_request');
    }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpError) {
        res.status(err.statusCode).json({
            type: err.errorType,
            message: err.message
        });
        return;
    }
    res.status(500).json({
        type: 'unknown_error',
        message: err.message || 'Internal server error'
    });
}
