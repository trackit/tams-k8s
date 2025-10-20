export class InvalidPageTokenError extends Error {
    constructor() {
        super('InvalidPageTokenError: the provided page token is invalid.');
    }
}
