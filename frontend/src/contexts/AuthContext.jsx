import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { registerServiceWorker, subscribeToPush } from "../utils/pushNotifications";
import { API_BASE } from "../config/api";

const AuthContext = createContext();

const SESSION_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
const API = API_BASE;

export const AuthProvider = ({ children }) => {
    const [user, setUser]                       = useState(null);
    const [token, setToken]                     = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const logoutTimerRef                        = useRef(null);

    /* ── helpers ─────────────────────────────────────────────────────────── */

    const clearLogoutTimer = () => {
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current);
            logoutTimerRef.current = null;
        }
    };

    /** Schedule an auto-logout for [delayMs] from now. */
    const scheduleAutoLogout = (delayMs) => {
        clearLogoutTimer();
        logoutTimerRef.current = setTimeout(() => {
            console.log("[Auth] Session expired — auto-logging out");
            logout();
        }, delayMs);
    };

    /* ── logout ──────────────────────────────────────────────────────────── */

    const logout = () => {
        clearLogoutTimer();

        // Try to unsubscribe push so stale subscriptions don't fire after logout
        const storedToken = localStorage.getItem("token");
        if (storedToken && "serviceWorker" in navigator) {
            navigator.serviceWorker.ready
                .then((reg) => reg.pushManager.getSubscription())
                .then((sub) => {
                    if (!sub) return;
                    return fetch(`${API}/push/unsubscribe`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${storedToken}`,
                        },
                        body: JSON.stringify({ endpoint: sub.endpoint }),
                    }).then(() => sub.unsubscribe());
                })
                .catch(() => {}); // best-effort; never block the logout
        }

        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("loginTime");
    };

    /* ── login ───────────────────────────────────────────────────────────── */

    const login = (authToken, userData) => {
        const loginTime = Date.now();
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("loginTime", String(loginTime));

        scheduleAutoLogout(SESSION_DURATION_MS);

        // Register service worker and subscribe to push notifications
        registerServiceWorker().then(() => subscribeToPush(authToken));
    };

    /* ── fetchUserProfile ────────────────────────────────────────────────── */

    const fetchUserProfile = async (authToken) => {
        try {
            const response = await fetch(`${API}/users/profile`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                logout(); // token rejected by server (expired / invalid)
            }
        } catch {
            console.error("[Auth] Could not fetch user profile");
        }
    };

    /* ── Restore session on mount ────────────────────────────────────────── */

    useEffect(() => {
        const storedToken   = localStorage.getItem("token");
        const loginTimeStr  = sessionStorage.getItem("loginTime");

        if (!storedToken) return;

        const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : null;
        const elapsed   = loginTime ? Date.now() - loginTime : SESSION_DURATION_MS + 1;

        if (elapsed >= SESSION_DURATION_MS) {
            // Session already expired — clear everything immediately
            logout();
            return;
        }

        // Session still valid — restore state and schedule the remaining time
        setToken(storedToken);
        setIsAuthenticated(true);
        fetchUserProfile(storedToken);
        scheduleAutoLogout(SESSION_DURATION_MS - elapsed);
    }, []);

    /* ── Cleanup on unmount ──────────────────────────────────────────────── */

    useEffect(() => () => clearLogoutTimer(), []);

    /* ── Context value ───────────────────────────────────────────────────── */

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
