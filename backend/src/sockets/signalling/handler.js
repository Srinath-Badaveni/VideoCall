/**
 * sockets/signalling/handler.js
 * 
 * Handles WebRTC P2P signalling (used only for WebRTCMeshAdapter).
 * In Stage 3 with SFU, these will be bypassed or replaced.
 */
export default function registerSignallingHandlers(io, socket) {
    socket.on("media:offer", ({ targetId, sdp }) => {
        io.to(targetId).emit("media:offer", { fromId: socket.id, sdp });
    });

    socket.on("media:answer", ({ targetId, sdp }) => {
        io.to(targetId).emit("media:answer", { fromId: socket.id, sdp });
    });

    socket.on("media:ice-candidate", ({ targetId, candidate }) => {
        io.to(targetId).emit("media:ice-candidate", { fromId: socket.id, candidate });
    });
}
