/**
 * errors.js — Custom error classes for consistent error handling.
 *
 * DESIGN: All application errors extend AppError which carries an HTTP status
 * code and a machine-readable error code. The centralized errorHandler middleware
 * catches these and produces consistent API responses.
 */

export class AppError extends Error {
    /**
     * @param {string} message  — Human-readable error message
     * @param {number} statusCode — HTTP status code
     * @param {string} code — Machine-readable error code (e.g. "USER_NOT_FOUND")
     */
    constructor(message, statusCode = 500, code = "INTERNAL_ERROR") {
        super(message);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.code = code;
        this.isOperational = true; // Distinguishes expected errors from bugs
    }
}

export class BadRequestError extends AppError {
    constructor(message = "Bad request", code = "BAD_REQUEST") {
        super(message, 400, code);
        this.name = "BadRequestError";
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = "Unauthorized", code = "UNAUTHORIZED") {
        super(message, 401, code);
        this.name = "UnauthorizedError";
    }
}

export class ForbiddenError extends AppError {
    constructor(message = "Forbidden", code = "FORBIDDEN") {
        super(message, 403, code);
        this.name = "ForbiddenError";
    }
}

export class NotFoundError extends AppError {
    constructor(message = "Not found", code = "NOT_FOUND") {
        super(message, 404, code);
        this.name = "NotFoundError";
    }
}

export class ConflictError extends AppError {
    constructor(message = "Conflict", code = "CONFLICT") {
        super(message, 409, code);
        this.name = "ConflictError";
    }
}

export class TooManyRequestsError extends AppError {
    constructor(message = "Too many requests", code = "TOO_MANY_REQUESTS") {
        super(message, 429, code);
        this.name = "TooManyRequestsError";
    }
}
