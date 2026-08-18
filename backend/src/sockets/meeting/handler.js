/**
 * sockets/meeting/handler.js
 * 
 * Handles meeting lifecycle and participant state events.
 */
export default function registerMeetingHandlers(io, socket) {
    socket.on("meeting:join", ({ meetingCode }) => {
        socket.join(`meeting:${meetingCode}`);
        socket.meetingCode = meetingCode;
        
        // Notify others
        socket.to(`meeting:${meetingCode}`).emit("meeting:participant-joined", {
            socketId: socket.id,
            userId: socket.user?._id,
            name: socket.user?.name
        });
    });

    socket.on("meeting:leave", ({ meetingCode }) => {
        socket.leave(`meeting:${meetingCode}`);
        socket.to(`meeting:${meetingCode}`).emit("meeting:participant-left", {
            socketId: socket.id
        });
        delete socket.meetingCode;
    });

    // Participant state
    const broadcastState = (state, value) => {
        if (socket.meetingCode) {
            socket.to(`meeting:${socket.meetingCode}`).emit("participant:state-changed", {
                socketId: socket.id,
                state,
                value
            });
        }
    };

    socket.on("participant:mute", () => broadcastState("audio", false));
    socket.on("participant:unmute", () => broadcastState("audio", true));
    socket.on("participant:camera-on", () => broadcastState("video", true));
    socket.on("participant:camera-off", () => broadcastState("video", false));
    socket.on("hand:raise", () => broadcastState("hand", true));
    socket.on("hand:lower", () => broadcastState("hand", false));
    socket.on("screen:start", () => broadcastState("screen", true));
    socket.on("screen:stop", () => broadcastState("screen", false));

    // Ephemeral Meeting Chat
    socket.on("meeting:chat-message", ({ meetingCode, message, sender }) => {
        io.to(`meeting:${meetingCode}`).emit("meeting:chat-message", {
            message,
            sender,
            timestamp: new Date()
        });
    });
}
