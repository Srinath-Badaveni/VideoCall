/**
 * env.js — Centralized environment configuration.
 *
 * DESIGN: Every environment variable the application needs is validated here
 * at startup. If a required variable is missing, the process exits immediately
 * with a clear error message rather than failing cryptically later.
 *
 * Import `config` from this module everywhere instead of reading process.env
 * directly.
 */
import dotenv from "dotenv";
dotenv.config();

// ── Required vs Optional ────────────────────────────────────────────────────
function required(name) {
    const value = process.env[name];
    if (!value) {
        console.error(`[FATAL] Missing required environment variable: ${name}`);
        process.exit(1);
    }
    return value;
}

function optional(name, fallback) {
    return process.env[name] || fallback;
}

// ── Build config object ─────────────────────────────────────────────────────
const config = Object.freeze({
    // Server
    port: parseInt(optional("PORT", "8080"), 10),
    nodeEnv: optional("NODE_ENV", "development"),
    isDev: optional("NODE_ENV", "development") === "development",
    isProd: optional("NODE_ENV", "development") === "production",

    // Database
    mongodbUrl: required("MONGODB_URL"),

    // LiveKit SFU
    livekitUrl: required("LIVEKIT_URL"),
    livekitApiKey: required("LIVEKIT_API_KEY"),
    livekitApiSecret: required("LIVEKIT_API_SECRET"),

    // JWT
    jwtSecret: required("JWT_SECRET"),
    jwtExpiresIn: optional("JWT_EXPIRES_IN", "3h"),

    // CORS
    corsOrigin: optional("CORS_ORIGIN", "http://localhost:3000"),

    // VAPID (Web Push) — optional, push is disabled without them
    vapidPublicKey: optional("VAPID_PUBLIC_KEY", ""),
    vapidPrivateKey: optional("VAPID_PRIVATE_KEY", ""),
    vapidEmail: optional("VAPID_EMAIL", "mailto:admin@videocaller.app"),

    // Redis (optional in dev, required in prod — enforced in Stage 2)
    redisUrl: optional("REDIS_URL", ""),

    // Rate Limiting
    rateLimitWindowMs: parseInt(optional("RATE_LIMIT_WINDOW_MS", "900000"), 10), // 15 min
    rateLimitMax: parseInt(optional("RATE_LIMIT_MAX", "100"), 10),
});

export default config;
