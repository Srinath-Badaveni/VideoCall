/**
 * errorHandler.js — Centralized Express error-handling middleware.
 *
 * DESIGN: Catches all errors (thrown or passed via next(err)) and returns
 * a consistent JSON response shape:
 *
 *   Success: { success: true,  data: {...}, message: "..." }
 *   Error:   { success: false, error: { code: "...", message: "..." } }
 *
 * Operational errors (AppError) return their status code.
 * Unexpected errors return 500 and log the full stack.
 */
import { AppError } from "../utils/errors.js";
import logger from "../utils/logger.js";

/**
 * Global error handler — must be registered AFTER all routes.
 * Express recognizes it as an error handler because it has 4 parameters.
 */
// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, _next) => {
    // Operational / expected errors
    if (err instanceof AppError) {
        logger.warn(
            { code: err.code, statusCode: err.statusCode, path: req.path },
            err.message
        );
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
            },
        });
    }

    // Mongoose validation errors
    if (err.name === "ValidationError") {
        const messages = Object.values(err.errors).map((e) => e.message);
        logger.warn({ path: req.path, errors: messages }, "Validation error");
        return res.status(400).json({
            success: false,
            error: {
                code: "VALIDATION_ERROR",
                message: messages.join(", "),
            },
        });
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || "field";
        logger.warn({ path: req.path, field }, "Duplicate key error");
        return res.status(409).json({
            success: false,
            error: {
                code: "DUPLICATE_KEY",
                message: `A record with this ${field} already exists`,
            },
        });
    }

    // JWT errors
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
        return res.status(401).json({
            success: false,
            error: {
                code: "INVALID_TOKEN",
                message: "Invalid or expired token",
            },
        });
    }

    // Unexpected errors — log full stack, return generic message
    logger.error({ err, path: req.path, method: req.method }, "Unhandled error");
    return res.status(500).json({
        success: false,
        error: {
            code: "INTERNAL_ERROR",
            message: "An unexpected error occurred",
        },
    });
};

/**
 * Helper: wrap async route handlers so thrown errors reach the error handler.
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }));
 */
export const asyncHandler = (fn) => (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);
