/**
 * socketManager.js — Default namespace Socket.IO handler.
 *
 * Handles video-call signalling (WebRTC negotiations, joining/leaving rooms).
 *
 * SECURITY CHANGES (Stage 0):
 *   - JWT authentication required for all connections
 *   - CORS restricted to configured origins
 *   - Structured logging via Pino
 *
 * NOTE: The in-memory `connections`, `messages`, `timeOnline` objects are a
 * scaling blocker (P0 #2). They will be replaced by Redis in Stage 2.
 * They are kept for now to preserve existing functionality.
 */
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import config from "../config/env.js";
import logger from "../utils/logger.js";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: config.corsOrigin.split(",").map((s) => s.trim()),
            methods: ["GET", "POST"],
            credentials: true,
        },
    });

    // ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) {
            return next(new Error("Authentication required: no token supplied"));
        }
        try {
            socket.user = jwt.verify(token, config.jwtSecret);
            next();
        } catch {
            return next(new Error("Authentication required: invalid token"));
        }
    });

    io.on("connection", (socket) => {
        logger.info({ socketId: socket.id, userId: socket.user?._id }, "Video socket connected");

        socket.on("join-room", (roomId) => {
            if (connections[roomId] === undefined) {
                connections[roomId] = [];
            }

            connections[roomId].push(socket.id);
            timeOnline[socket.id] = Date.now();

            // Notify existing users that a new user has joined
            for (let a = 0; a < connections[roomId].length; a++) {
                io.to(connections[roomId][a]).emit(
                    "user-joined",
                    socket.id,
                    connections[roomId]
                );
            }

            // Send previous messages if any
            if (messages[roomId] !== undefined) {
                for (let a = 0; a < messages[roomId].length; ++a) {
                    io.to(socket.id).emit(
                        "chat-message",
                        messages[roomId][a]["data"],
                        messages[roomId][a]["sender"],
                        messages[roomId][a]["socket-id-sender"]
                    );
                }
            }

            socket.join(roomId);
        });

        socket.on("signal", (toId, message) => {
            io.to(toId).emit("signal", socket.id, message);
        });

        socket.on("chat-message", (data, sender) => {
            // Find which room the sender belongs to
            let matchingRoom = null;
            for (const [roomKey, roomValue] of Object.entries(connections)) {
                if (roomValue.includes(socket.id)) {
                    matchingRoom = roomKey;
                    break;
                }
            }

            if (matchingRoom) {
                if (messages[matchingRoom] === undefined) {
                    messages[matchingRoom] = [];
                }
                messages[matchingRoom].push({
                    data,
                    sender,
                    "socket-id-sender": socket.id,
                });

                // Send the chat message to all users in that room
                connections[matchingRoom].forEach((userId) => {
                    io.to(userId).emit("chat-message", data, sender, socket.id);
                });
            }
        });

        socket.on("disconnect", () => {
            const diffTime = Math.abs(timeOnline[socket.id] - Date.now());
            logger.info({ socketId: socket.id, durationMs: diffTime }, "Video socket disconnected");

            let roomKey;
            for (const [k, v] of Object.entries(connections)) {
                if (v.includes(socket.id)) {
                    roomKey = k;

                    // Notify others that user disconnected
                    for (let a = 0; a < connections[roomKey].length; a++) {
                        io.to(connections[roomKey][a]).emit(
                            "user-disconnected",
                            socket.id,
                            connections[roomKey]
                        );
                    }

                    const index = connections[roomKey].indexOf(socket.id);
                    connections[roomKey].splice(index, 1);

                    if (connections[roomKey].length === 0) {
                        delete connections[roomKey];
                        delete messages[roomKey];
                    }

                    break;
                }
            }

            delete timeOnline[socket.id];
        });
    });

    return io;
};
