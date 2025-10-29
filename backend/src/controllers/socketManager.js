import { Server } from "socket.io";

let connections = {};
let messages = {};
let timeOnline = {};

export const connectToSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
            allowedHeaders: ["*"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log("something is connected: ", socket.id);

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
            console.log(`Socket ${socket.id} disconnected after ${diffTime} ms`);

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
