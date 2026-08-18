/**
 * app.js — Application entry point.
 *
 * Stage 0: Added centralized config, structured logging, helmet security
 * headers, rate limiting, centralized error handler, health endpoint.
 *
 * NOTE: This file will be split into app.js + server.js in Stage 1.
 */
import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

// Centralized config (validates env vars on import — fails fast)
import config from "./src/config/env.js";
import logger from "./src/utils/logger.js";

import { initializeSockets } from "./src/sockets/index.js";

import authRoutes from "./src/routes/auth.routes.js";
import userRoutes from "./src/routes/users.routes.js";
import chatRoutes from "./src/routes/chat.routes.js";
import pushRoutes from "./src/routes/push.routes.js";
import friendRoutes from "./src/routes/friend.routes.js";
import meetingRoutes from "./src/routes/meeting.routes.js";
import healthRoutes from "./src/routes/health.routes.js";

import { initWebPush } from "./src/controllers/push.controller.js";
import { errorHandler } from "./src/middleware/errorHandler.js";
import { apiLimiter, authLimiter } from "./src/middleware/rateLimiter.js";

const app = express();
const server = createServer(app);

// ── Socket.IO ────────────────────────────────────────────────────────────────
// Initialize the centralized socket manager (which handles namespaces and auth)
initializeSockets(server);

// ── Security Middleware ──────────────────────────────────────────────────────
app.use(helmet({
    contentSecurityPolicy: false, // Allow inline scripts for development
}));

app.use(cors({
    origin: config.corsOrigin.split(",").map((s) => s.trim()),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
}));

// ── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "50kb" }));
app.use(express.urlencoded({ extended: true, limit: "50kb" }));

// ── Rate Limiting ────────────────────────────────────────────────────────────
app.use("/api/v1/auth", authLimiter);
app.use("/api/", apiLimiter);

// ── Routes ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
    res.json({ success: true, message: "NexCall API Server" });
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/meetings", meetingRoutes);
app.use("/api/v1/chat", chatRoutes);
app.use("/api/v1/push", pushRoutes);
app.use("/api/v1/friends", friendRoutes);
app.use("/api/v1/health", healthRoutes);

// ── Centralized Error Handler (must be AFTER all routes) ─────────────────────
app.use(errorHandler);

// ── Startup ──────────────────────────────────────────────────────────────────
const start = async () => {
    // Initialize VAPID for Web Push
    if (config.vapidPublicKey && config.vapidPrivateKey) {
        initWebPush();
        logger.info("[Push] VAPID initialized");
    } else {
        logger.warn("[Push] VAPID keys missing — Web Push disabled");
    }

    // Connect to MongoDB
    const connectdb = await mongoose.connect(config.mongodbUrl);
    logger.info({ host: connectdb.connection.host }, "Connected to MongoDB");

    // Start HTTP server
    server.listen(config.port, () => {
        logger.info({ port: config.port, env: config.nodeEnv }, "Server is running");
    });
};

start().catch((err) => {
    logger.fatal({ err }, "Failed to start server");
    process.exit(1);
});
