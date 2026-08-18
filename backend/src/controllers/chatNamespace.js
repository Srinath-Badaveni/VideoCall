/**
 * chatNamespace.js
 * Dedicated Socket.IO /chat namespace.
 * - ALL connections MUST supply a valid JWT in socket.handshake.auth.token
 * - Messages are persisted to MongoDB via ChatMessage model
 * - DM messages trigger a Web Push notification when the recipient is NOT in the room
 * - Invitation system with friend-gate
 */

import jwt from "jsonwebtoken";
import config from "../config/env.js";
import logger from "../utils/logger.js";
import { areFriends } from "./friend.controller.js";
import ChatMessage from "../models/chatMessage.model.js";
import Group from "../models/group.model.js";
import { sendPushToUser } from "./push.controller.js";

// ── In-memory stores ─────────────────────────────────────────────────────────
// onlineUsers  : { socketId: { userId, name, email, roomId } }
// userSockets  : { userId: socketId }   – direct invite/push delivery
// pendingInvites: { inviteId: { fromSocketId, toSocketId, roomId } }
let onlineUsers = {};
let userSockets = {};
let pendingInvites = {};

const MAX_HISTORY = 50; // messages loaded from DB per room

let _chatNs = null;

/** JWT verification */
const verifyToken = (token) => jwt.verify(token, config.jwtSecret);

/** Count sockets in a Socket.IO room */
function roomSize(roomId) {
    const r = _chatNs?.adapter?.rooms?.get(roomId);
    return r ? r.size : 0;
}

/** Unique invite ID */
function makeInviteId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function serialise(doc) {
    let serializedReactions = {};
    if (doc.reactions) {
        if (doc.reactions instanceof Map) {
            serializedReactions = Object.fromEntries(doc.reactions);
        } else if (typeof doc.reactions === 'object') {
            serializedReactions = { ...doc.reactions };
        }
    }

    return {
        _id: doc._id,
        userId: doc.userId,
        sender: doc.sender,
        message: doc.message,
        reactions: serializedReactions,
        replyTo: doc.replyTo,
        timestamp: doc.createdAt?.toISOString() ?? new Date().toISOString(),
    };
}

/** Load last MAX_HISTORY messages for a room from DB */
async function loadHistory(roomId) {
    try {
        const docs = await ChatMessage.find({ roomId })
            .sort({ createdAt: -1 })
            .limit(MAX_HISTORY)
            .lean();
        return docs.reverse().map(serialise);
    } catch {
        return [];
    }
}

/** Save a message to DB */
async function persistMessage(roomId, userId, sender, message, replyTo = null) {
    try {
        const payload = { roomId, userId, sender, message };
        if (replyTo) payload.replyTo = replyTo;
        
        const doc = await ChatMessage.create(payload);
        return serialise(doc);
    } catch (err) {
        console.error("[Chat] persistMessage error:", err.message);
        // Return a plain object so broadcasting still works even if DB is down
        return { _id: Date.now().toString(), userId, sender, message, replyTo, reactions: {}, timestamp: new Date().toISOString() };
    }
}

/** Push a notification to a user who is NOT actively in the target room */
async function maybeNotify(toUserId, fromName, messageText, roomId) {
    // Only push if they're offline from /chat namespace OR in a different room
    const theirSocketId = userSockets[toUserId];
    const theirRoom = theirSocketId ? onlineUsers[theirSocketId]?.roomId : null;
    if (theirRoom === roomId) return; // they're already watching the room — no push needed

    const isDm = roomId.startsWith("dm_");
    const title = isDm ? `💬 ${fromName}` : `💬 ${fromName} in #${roomId}`;
    await sendPushToUser(toUserId, title, messageText, "/chat");
}

/** Parse a DM room ID → array of two userIds  (room format: dm_<id1>_<id2>) */
function parseDmUsers(roomId) {
    const parts = roomId.split("_"); // ["dm", id1, id2]
    return parts.length === 3 ? [parts[1], parts[2]] : [];
}

/* ═══════════════════════════════════════════════════════════════════════════ */
export const connectToChatSocket = (io) => {
    const chatNs = io.of("/chat");
    _chatNs = chatNs;

    // ── AUTH MIDDLEWARE ──────────────────────────────────────────────────────
    chatNs.use((socket, next) => {
        const token = socket.handshake.auth?.token;
        if (!token) return next(new Error("Authentication required: no token supplied"));
        try {
            socket.user = verifyToken(token);
            next();
        } catch {
            return next(new Error("Authentication required: invalid token"));
        }
    });

    // ── CONNECTION ───────────────────────────────────────────────────────────
    chatNs.on("connection", (socket) => {
        const { _id: userId, name, email } = socket.user;
        logger.info({ userId, socketId: socket.id }, `[Chat] ${name} connected`);

        // Register immediately so the user shows as online everywhere
        // (even before they join a specific room)
        userSockets[userId] = socket.id;
        onlineUsers[socket.id] = { userId, name, email, roomId: null };

        // Broadcast updated online list to ALL connected clients
        const broadcastOnline = () => {
            const users = Object.values(onlineUsers).map((u) => ({
                userId: u.userId, name: u.name, email: u.email, roomId: u.roomId,
            }));
            chatNs.emit("online-users", users);
        };

        broadcastOnline(); // tell everyone a new user came online

        // ── get-online-users ─────────────────────────────────────────────────
        socket.on("get-online-users", () => {
            const users = Object.values(onlineUsers).map((u) => ({
                userId: u.userId, name: u.name, email: u.email, roomId: u.roomId,
            }));
            socket.emit("online-users", users);
        });

        // ── join-chat-room ───────────────────────────────────────────────────
        socket.on("join-chat-room", async ({ roomId }) => {
            if (!roomId) return;

            // Security check: If it's not a DM, verify it's a valid Group and user is a member
            if (!roomId.startsWith("dm_")) {
                try {
                    const group = await Group.findById(roomId);
                    if (!group) {
                        socket.emit("chat-error", { message: "Group not found" });
                        return;
                    }
                    if (!group.members.some(id => id.toString() === userId.toString())) {
                        socket.emit("chat-error", { message: "You are not a member of this group" });
                        return;
                    }
                } catch (err) {
                    socket.emit("chat-error", { message: "Invalid room ID" });
                    return;
                }
            }

            // Leave previous room if any (stay connected)
            const prev = onlineUsers[socket.id];
            if (prev?.roomId) leaveRoom(chatNs, socket, prev.roomId);

            socket.join(roomId);
            // Update (don't replace) the existing onlineUsers entry
            onlineUsers[socket.id] = { userId, name, email, roomId };

            // Load and send persisted history
            const history = await loadHistory(roomId);
            socket.emit("message-history", history);

            // Broadcast presence
            const count = roomSize(roomId);
            chatNs.to(roomId).emit("room-user-count", { roomId, count });

            const roomUsers = Object.values(onlineUsers)
                .filter((u) => u.roomId === roomId)
                .map((u) => ({ userId: u.userId, name: u.name }));
            chatNs.to(roomId).emit("room-users", roomUsers);

            socket.to(roomId).emit("user-joined-chat", { socketId: socket.id, username: name, count });

            // Broadcast updated global online list
            broadcastOnline();
        });

        // ── leave-chat-room (explicit, without disconnecting) ────────────────
        // Client calls this when the user navigates away from a chat room.
        // The socket stays connected so the user remains visible as online.
        socket.on("leave-chat-room", () => {
            const user = onlineUsers[socket.id];
            if (!user?.roomId) return;
            leaveRoom(chatNs, socket, user.roomId);
            // Mark as online but not in a room
            onlineUsers[socket.id] = { userId, name, email, roomId: null };
            broadcastOnline();
        });

        // ── chat-message ─────────────────────────────────────────────────────
        socket.on("chat-message", async ({ message, replyTo }) => {
            const user = onlineUsers[socket.id];
            if (!user || !user.roomId || !message?.trim()) return;

            // Persist to MongoDB
            const msgObj = await persistMessage(user.roomId, userId, user.name, message.trim(), replyTo);

            // Broadcast to everyone in the room
            chatNs.to(user.roomId).emit("chat-message", msgObj);

            // ── Push notification for DM rooms ──────────────────────────────
            if (user.roomId.startsWith("dm_")) {
                const [u1, u2] = parseDmUsers(user.roomId);
                const recipientId = u1 === userId.toString() ? u2 : u1;
                if (recipientId) {
                    maybeNotify(recipientId, user.name, message.trim(), user.roomId);
                }
            }
        });

        // ── chat-reaction ────────────────────────────────────────────────────
        socket.on("chat-reaction", async ({ messageId, emoji }) => {
            const user = onlineUsers[socket.id];
            if (!user || !user.roomId || !messageId || !emoji) return;

            try {
                const msg = await ChatMessage.findById(messageId);
                if (!msg || msg.roomId !== user.roomId) return; // Must be in same room

                const currentReacts = msg.reactions.get(emoji) || [];
                const userIndex = currentReacts.indexOf(user.name);

                if (userIndex > -1) {
                    currentReacts.splice(userIndex, 1);
                } else {
                    currentReacts.push(user.name);
                }

                if (currentReacts.length === 0) {
                    msg.reactions.delete(emoji);
                } else {
                    msg.reactions.set(emoji, currentReacts);
                }

                await msg.save();
                
                chatNs.to(user.roomId).emit("chat-reaction", {
                    messageId,
                    reactions: Object.fromEntries(msg.reactions)
                });
            } catch (err) {
                console.error("[Chat] reaction error:", err.message);
            }
        });

        // ── typing ───────────────────────────────────────────────────────────
        socket.on("typing", () => {
            const user = onlineUsers[socket.id];
            if (!user) return;
            socket.to(user.roomId).emit("typing", { username: user.name });
        });

        socket.on("stop-typing", () => {
            const user = onlineUsers[socket.id];
            if (!user) return;
            socket.to(user.roomId).emit("stop-typing", { username: user.name });
        });

        // ── INVITATION EVENTS ────────────────────────────────────────────────

        socket.on("send-invitation", async ({ toUserId }) => {
            const fromUser = onlineUsers[socket.id];
            if (!fromUser?.roomId) return;

            const toSocketId = userSockets[toUserId];
            if (!toSocketId) {
                socket.emit("invitation-error", { message: "User is not online" });
                return;
            }

            // Friend gate
            const friends = await areFriends(userId, toUserId);
            if (!friends) {
                socket.emit("invitation-error", { message: "You can only invite friends" });
                return;
            }

            const inviteId = makeInviteId();
            pendingInvites[inviteId] = { fromSocketId: socket.id, toSocketId, roomId: fromUser.roomId };

            chatNs.to(toSocketId).emit("receive-invitation", {
                inviteId,
                fromName: fromUser.name,
                fromUserId: userId,
                roomId: fromUser.roomId,
            });

            socket.emit("invitation-sent", { toUserId, roomId: fromUser.roomId });
        });

        socket.on("accept-invitation", async ({ inviteId }) => {
            const invite = pendingInvites[inviteId];
            if (!invite) return;
            const { fromSocketId, roomId } = invite;

            const prev = onlineUsers[socket.id];
            if (prev?.roomId) leaveRoom(chatNs, socket, prev.roomId);

            socket.join(roomId);
            onlineUsers[socket.id] = { userId, name, email, roomId };

            const history = await loadHistory(roomId);
            socket.emit("message-history", history);

            const count = roomSize(roomId);
            chatNs.to(roomId).emit("room-user-count", { roomId, count });

            const roomUsers = Object.values(onlineUsers)
                .filter((u) => u.roomId === roomId)
                .map((u) => ({ userId: u.userId, name: u.name }));
            chatNs.to(roomId).emit("room-users", roomUsers);

            socket.to(roomId).emit("user-joined-chat", { socketId: socket.id, username: name, count });
            chatNs.to(fromSocketId).emit("invitation-accepted", { byName: name, roomId });
            socket.emit("joined-via-invite", { roomId });

            delete pendingInvites[inviteId];
        });

        socket.on("reject-invitation", ({ inviteId }) => {
            const invite = pendingInvites[inviteId];
            if (!invite) return;
            chatNs.to(invite.fromSocketId).emit("invitation-rejected", { byName: name });
            delete pendingInvites[inviteId];
        });

        // ── disconnect ───────────────────────────────────────────────────────
        socket.on("disconnect", () => {
            const user = onlineUsers[socket.id];
            if (user?.roomId) leaveRoom(chatNs, socket, user.roomId);
            if (userSockets[userId] === socket.id) delete userSockets[userId];
            delete onlineUsers[socket.id];
            logger.info({ userId, socketId: socket.id }, `[Chat] ${name} disconnected`);

            // Tell everyone this user went offline
            const users = Object.values(onlineUsers).map((u) => ({
                userId: u.userId, name: u.name, email: u.email, roomId: u.roomId,
            }));
            chatNs.emit("online-users", users);
        });
    });

    return chatNs;
};

// ── Shared leave helper ───────────────────────────────────────────────────────
function leaveRoom(chatNs, socket, roomId) {
    socket.leave(roomId);
    const count = roomSize(roomId);

    chatNs.to(roomId).emit("user-left-chat", {
        socketId: socket.id,
        username: onlineUsers[socket.id]?.name,
        count,
    });
    chatNs.to(roomId).emit("room-user-count", { roomId, count });

    const roomUsers = Object.values(onlineUsers)
        .filter((u) => u.roomId === roomId && u !== onlineUsers[socket.id])
        .map((u) => ({ userId: u.userId, name: u.name }));
    chatNs.to(roomId).emit("room-users", roomUsers);
}
