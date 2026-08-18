/**
 * sockets/chat/handler.js
 * 
 * Handles real-time chat messages.
 */
import * as chatService from "../../services/chat.service.js";
import logger from "../../utils/logger.js";

export default function registerChatHandlers(io, socket) {
    socket.on("chat:join", ({ conversationId }) => {
        socket.join(`chat:${conversationId}`);
    });

    socket.on("chat:message", async ({ conversationId, content }) => {
        try {
            const senderId = socket.user._id;
            const name = socket.user.name;
            
            // Save to DB
            const message = await chatService.saveMessage(conversationId, senderId, name, content);
            
            // Broadcast
            io.to(`chat:${conversationId}`).emit("chat:message", message);
        } catch (err) {
            logger.error({ err }, "Failed to save chat message");
        }
    });

    socket.on("chat:typing", ({ conversationId }) => {
        socket.to(`chat:${conversationId}`).emit("chat:typing", {
            userId: socket.user?._id,
            conversationId
        });
    });
}
