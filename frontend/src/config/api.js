// Centralized API base URL resolver
// Prefers REACT_APP_SERVER_API, then REACT_APP_SERVER_URL, then a safe localhost default.
const apiFromPrimary = process.env.REACT_APP_SERVER_API;
const apiFromAlt = process.env.REACT_APP_SERVER_URL;
const DEFAULT_API = "http://localhost:5000";

let server_api = apiFromPrimary || apiFromAlt || DEFAULT_API;

if (!apiFromPrimary && apiFromAlt) {
    // Informative warning to help developers consolidate env names
    // (This is intentionally a console.warn so it only appears in dev tools)
    console.warn(
        "REACT_APP_SERVER_API is not defined. Using REACT_APP_SERVER_URL as a fallback:",
        apiFromAlt
    );
} else if (!apiFromPrimary && !apiFromAlt) {
    console.warn(
        `Neither REACT_APP_SERVER_API nor REACT_APP_SERVER_URL are defined. Falling back to ${DEFAULT_API}`
    );
}

export default server_api;
