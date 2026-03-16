/**
 * api.js — Single source of truth for the backend server URL.
 * Reads from REACT_APP_SERVER_URL (set in .env).
 * Falls back to localhost:8080 for local development.
 */
const server_api =
    process.env.REACT_APP_SERVER_API ||
    process.env.REACT_APP_SERVER_URL ||
    "http://localhost:8080";

export default server_api;

/** REST base path — import this for all HTTP fetch calls */
export const API_BASE = `${server_api}/api/v1`;
