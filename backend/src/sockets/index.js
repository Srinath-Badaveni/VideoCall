/**
 * sockets/index.js
 * 
 * Centralized Socket.IO configuration.
 */
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import config from "../config/env.js";
import logger from "../utils/logger.js";
import { socketAuthMiddleware } from "./auth.js";
import registerSignallingHandlers from "./signalling/handler.js";
import registerMeetingHandlers from "./meeting/handler.js";
import registerChatHandlers from "./chat/handler.js";
import registerPresenceHandlers from "./presence/handler.js";

export function initializeSockets(httpServer) {
    const io = new Server(httpServer, {
        cors: {
            origin: true,
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    if (config.redisUrl) {
        const pubClient = new Redis(config.redisUrl);
        const subClient = pubClient.duplicate();
        
        io.adapter(createAdapter(pubClient, subClient));
        logger.info("Socket.IO Redis adapter attached");
    }

    // Main namespace
    io.use(socketAuthMiddleware);

    io.on("connection", (socket) => {
        logger.info({ socketId: socket.id, userId: socket.user?._id }, "Client connected");

        registerSignallingHandlers(io, socket);
        registerMeetingHandlers(io, socket);
        registerChatHandlers(io, socket);
        registerPresenceHandlers(io, socket);

        socket.on("disconnect", () => {
            logger.info({ socketId: socket.id, userId: socket.user?._id }, "Client disconnected");
        });
    });

    return io;
}
