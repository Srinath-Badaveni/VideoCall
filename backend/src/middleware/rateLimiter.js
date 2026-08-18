/**
 * rateLimiter.js — Express rate limiting middleware.
 *
 * DESIGN: In-memory rate limiting for now. In Stage 2 this will be
 * backed by Redis for distributed rate limiting across multiple servers.
 *
 * Different limits for different route types:
 *   - Auth routes (login/register): stricter (prevent brute force)
 *   - General API: moderate
 *   - Health: no limiting
 */
import rateLimit from "express-rate-limit";
import config from "../config/env.js";

/**
 * General API rate limiter.
 * Default: 100 requests per 15 minutes per IP.
 */
export const apiLimiter = rateLimit({
    windowMs: config.rateLimitWindowMs,
    max: config.rateLimitMax,
    skip: () => config.nodeEnv === "development",
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many requests, please try again later",
        },
    },
});

/**
 * Strict rate limiter for authentication endpoints.
 * 20 requests per 15 minutes per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skip: () => config.nodeEnv === "development",
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: "TOO_MANY_REQUESTS",
            message: "Too many authentication attempts, please try again later",
        },
    },
});
