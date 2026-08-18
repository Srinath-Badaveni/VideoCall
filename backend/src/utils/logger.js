/**
 * logger.js — Structured logging with Pino.
 *
 * DESIGN: Replaces all console.log/console.error with structured JSON logs.
 * In development, pino-pretty formats logs for readability.
 * In production, raw JSON is emitted for log aggregation tools.
 *
 * Usage:
 *   import logger from '../utils/logger.js';
 *   logger.info({ userId }, 'User logged in');
 *   logger.error({ err }, 'Database connection failed');
 */
import pino from "pino";
import config from "../config/env.js";

const logger = pino({
    level: config.isDev ? "debug" : "info",
    transport: config.isDev
        ? {
              target: "pino-pretty",
              options: {
                  colorize: true,
                  translateTime: "SYS:standard",
                  ignore: "pid,hostname",
              },
          }
        : undefined,
    // In production, pino outputs raw JSON (no transport) for best performance
    ...(config.isProd && {
        formatters: {
            level: (label) => ({ level: label }),
        },
        timestamp: pino.stdTimeFunctions.isoTime,
    }),
});

export default logger;
