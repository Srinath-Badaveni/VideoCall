/**
 * sockets/presence/handler.js
 * 
 * Handles online/offline presence tracking.
 */
// In-memory store for Stage 1. Will move to Redis in Stage 2.
export const onlineUsers = new Map(); // socketId -> userId

export default function registerPresenceHandlers(io, socket) {
    const userId = socket.user?._id;
    if (userId) {
        onlineUsers.set(socket.id, userId);
        socket.broadcast.emit("presence:online", { userId });
    }

    socket.on("disconnect", () => {
        if (userId) {
            onlineUsers.delete(socket.id);
            // Check if user has other active sockets before emitting offline
            const hasOtherSockets = Array.from(onlineUsers.values()).includes(userId);
            if (!hasOtherSockets) {
                socket.broadcast.emit("presence:offline", { userId });
            }
        }
    });

    socket.on("call-user", ({ targetUserId, meetingCode }) => {
        // Find all sockets for targetUserId
        for (const [sId, uId] of onlineUsers.entries()) {
            if (uId.toString() === targetUserId.toString()) {
                io.to(sId).emit("incoming-call", {
                    meetingCode,
                    callerName: socket.user?.name || "Someone"
                });
            }
        }
    });
}
