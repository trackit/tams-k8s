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

export class ForbiddenHttpError extends HttpError {
    constructor(message?: string) {
        super(403, message ? `Forbidden: ${message}` : 'Forbidden', 'forbidden');
    }
}

export class ConflictHttpError extends HttpError {
    constructor(message?: string) {
        super(409, message ? `Conflict: ${message}` : 'Conflict', 'conflict');
    }
}

export class NotFoundHttpError extends HttpError {
    constructor(message?: string) {
        super(404, message ? `Not found: ${message}` : 'Not found', 'not_found');
    }
}

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpError) {
        res
            .status(err.statusCode)
            .header({ 'Content-Type': 'application/json' })
            .send(JSON.stringify({
                type: err.errorType,
                message: err.message
            }));
        return;
    }
    res
        .status(500)
        .header({ 'Content-Type': 'application/json' })
        .send(JSON.stringify({
            type: 'unknown_error',
            message: err.message || 'Internal server error'
        }));
}
