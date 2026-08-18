/**
 * SocketManager.js
 * 
 * Centralized Socket.IO client manager.
 */
import { io } from "socket.io-client";
import { SocketEvents } from "./events.js";

const SERVER_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:8080";

class SocketManager {
    constructor() {
        this.socket = null;
        this.listeners = new Map();
    }

    connect(token) {
        if (this.socket && this.socket.connected) return this.socket;

        this.socket = io(SERVER_URL, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: Infinity
        });

        this.socket.on(SocketEvents.CONNECT, () => {
            console.log("[Socket] Connected:", this.socket.id);
            this.emit("connected");
        });

        this.socket.on(SocketEvents.DISCONNECT, (reason) => {
            console.log("[Socket] Disconnected:", reason);
            this.emit("disconnected", reason);
        });

        this.socket.on(SocketEvents.CONNECT_ERROR, (err) => {
            console.error("[Socket] Connection error:", err.message);
            this.emit("error", err);
        });

        return this.socket;
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    getSocket() {
        return this.socket;
    }

    // Custom event emitter for components to listen to socket state changes
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, new Set());
        }
        this.listeners.get(event).add(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).delete(callback);
        }
    }

    emit(event, ...args) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(cb => cb(...args));
        }
    }
}

export const socketManager = new SocketManager();
