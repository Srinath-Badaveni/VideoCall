/**
 * ChatContext.jsx
 *
 * Key design decisions:
 * 1. The socket CONNECTS automatically as soon as the user has a token (login).
 *    It NEVER fully disconnects while the user is logged in.
 * 2. "Leave room" only emits a leave event — it does NOT disconnect the socket.
 *    This keeps the user visible as "online" in the friends list everywhere in the app.
 * 3. On logout (token removed), the socket is cleanly disconnected.
 * 4. DM rooms use the same socket/namespace. History is loaded from MongoDB on every join.
 */

import React, {
    createContext,
    useContext,
    useState,
    useRef,
    useCallback,
    useEffect,
} from "react";
import io from "socket.io-client";
import { useAuth } from "./AuthContext";
import server_api from "../config/api";

const ChatContext = createContext();

const CHAT_SERVER_URL = server_api;

export const ChatProvider = ({ children }) => {
    const { token } = useAuth();
    const socketRef = useRef(null);

    const [connected, setConnected] = useState(false);
    const [inRoom, setInRoom] = useState(false);
    const [messages, setMessages] = useState([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    const [currentUser, setCurrentUser] = useState(null); // { name, roomId, dmFriendName }
    const [roomUsers, setRoomUsers] = useState([]);
    const [allOnlineUsers, setAllOnlineUsers] = useState([]);
    const [error, setError] = useState(null);

    // Invitation state
    const [pendingInvite, setPendingInvite] = useState(null);
    const [inviteNotification, setInviteNotification] = useState(null);

    /* ── Core connect / disconnect ────────────────────────────────────────── */

    /** Establish (or reuse) the socket connection to /chat namespace */
    const connect = useCallback(() => {
        if (socketRef.current?.connected) return;
        if (!token) return;

        // If a stale socket exists, clean it up first
        if (socketRef.current) {
            socketRef.current.removeAllListeners();
            socketRef.current.disconnect();
        }

        const socket = io(`${CHAT_SERVER_URL}/chat`, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 10,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
            setConnected(true);
            setError(null);
            // Immediately fetch the current online list so friends panel updates
            socket.emit("get-online-users");
        });

        socket.on("disconnect", () => {
            setConnected(false);
            setInRoom(false);
        });

        socket.on("connect_error", (err) => {
            setError(err.message || "Cannot connect to chat server.");
        });

        // ── Chat events ────────────────────────────────────────────────────
        socket.on("message-history", (history) => setMessages(history));
        socket.on("chat-message", (msg) => setMessages((prev) => [...prev, msg]));
        socket.on("room-user-count", ({ count }) => setOnlineCount(count));
        socket.on("room-users", (users) => setRoomUsers(users));
        socket.on("online-users", (users) => setAllOnlineUsers(users));

        socket.on("user-joined-chat", ({ username, count }) => {
            setOnlineCount(count);
            setMessages((prev) => [
                ...prev,
                { system: true, message: `${username} joined`, timestamp: new Date().toISOString() },
            ]);
        });

        socket.on("user-left-chat", ({ username, count }) => {
            setOnlineCount(count);
            setMessages((prev) => [
                ...prev,
                { system: true, message: `${username} left`, timestamp: new Date().toISOString() },
            ]);
        });

        socket.on("typing", ({ username }) =>
            setTypingUsers((p) => (p.includes(username) ? p : [...p, username]))
        );

        socket.on("stop-typing", ({ username }) =>
            setTypingUsers((p) => p.filter((u) => u !== username))
        );

        // ── Invitation events ──────────────────────────────────────────────
        socket.on("receive-invitation", ({ inviteId, fromName, roomId }) => {
            setPendingInvite({ inviteId, fromName, roomId });
        });

        socket.on("invitation-sent", () => {
            setInviteNotification({ type: "success", message: "Invitation sent!" });
            setTimeout(() => setInviteNotification(null), 3000);
        });

        socket.on("invitation-accepted", ({ byName, roomId }) => {
            setInviteNotification({ type: "success", message: `${byName} accepted your invite to #${roomId}` });
            setTimeout(() => setInviteNotification(null), 4000);
        });

        socket.on("invitation-rejected", ({ byName }) => {
            setInviteNotification({ type: "error", message: `${byName} declined your invitation.` });
            setTimeout(() => setInviteNotification(null), 4000);
        });

        socket.on("invitation-error", ({ message }) => {
            setInviteNotification({ type: "error", message });
            setTimeout(() => setInviteNotification(null), 4000);
        });

        socket.on("joined-via-invite", ({ roomId }) => {
            setInRoom(true);
            setCurrentUser((prev) => (prev ? { ...prev, roomId } : null));
            setPendingInvite(null);
        });
    }, [token]);

    /* ── Auto-connect: fires whenever the user logs in (token changes) ──── */
    useEffect(() => {
        if (token) {
            connect();
        } else {
            // User logged out – cleanly disconnect
            if (socketRef.current) {
                socketRef.current.removeAllListeners();
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setConnected(false);
            setInRoom(false);
            setCurrentUser(null);
            setAllOnlineUsers([]);
        }
    }, [token]);

    /* Cleanup on component unmount */
    useEffect(() => {
        return () => {
            socketRef.current?.removeAllListeners();
            socketRef.current?.disconnect();
        };
    }, []);

    /* ── Room actions ─────────────────────────────────────────────────────── */

    /** Join a chat room (or DM). Connects first if needed. */
    const joinRoom = useCallback(
        (roomId, userName, dmFriendName = null) => {
            const doJoin = () => {
                socketRef.current?.emit("join-chat-room", { roomId });
                socketRef.current?.emit("get-online-users");
            };

            if (!socketRef.current?.connected) {
                connect();
                // Small delay to let the socket handshake complete
                setTimeout(doJoin, 600);
            } else {
                doJoin();
            }

            setCurrentUser({ name: userName, roomId, dmFriendName });
            setMessages([]);
            setTypingUsers([]);
            setInRoom(true);
        },
        [connect]
    );

    /**
     * Leave the current room WITHOUT disconnecting the socket.
     * The user stays "online" globally — they just stop receiving room events.
     */
    const leaveRoom = useCallback(() => {
        if (socketRef.current?.connected) {
            socketRef.current.emit("leave-chat-room");
        }
        setInRoom(false);
        setMessages([]);
        setOnlineCount(0);
        setTypingUsers([]);
        setCurrentUser(null);
        setRoomUsers([]);
        setPendingInvite(null);
        // Keep allOnlineUsers — they're still globally online
    }, []);

    /* ── Message / typing ────────────────────────────────────────────────── */

    const sendMessage = useCallback((message) => {
        if (!socketRef.current?.connected || !message.trim()) return;
        socketRef.current.emit("chat-message", { message });
    }, []);

    const typingTimeoutRef = useRef(null);
    const sendTyping = useCallback(() => {
        if (!socketRef.current?.connected) return;
        socketRef.current.emit("typing");
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => socketRef.current?.emit("stop-typing"), 2000);
    }, []);

    /* ── Invitations ─────────────────────────────────────────────────────── */

    const sendInvitation = useCallback((toUserId) => {
        socketRef.current?.emit("send-invitation", { toUserId });
    }, []);

    const acceptInvitation = useCallback((inviteId) => {
        socketRef.current?.emit("accept-invitation", { inviteId });
    }, []);

    const rejectInvitation = useCallback((inviteId) => {
        socketRef.current?.emit("reject-invitation", { inviteId });
        setPendingInvite(null);
    }, []);

    const refreshOnlineUsers = useCallback(() => {
        socketRef.current?.emit("get-online-users");
    }, []);

    /* ── Context value ───────────────────────────────────────────────────── */

    return (
        <ChatContext.Provider
            value={{
                connected, inRoom, messages, onlineCount, typingUsers,
                currentUser, roomUsers, allOnlineUsers, error,
                pendingInvite, inviteNotification,
                connect, joinRoom, sendMessage, sendTyping, leaveRoom,
                sendInvitation, acceptInvitation, rejectInvitation, refreshOnlineUsers,
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const ctx = useContext(ChatContext);
    if (!ctx) throw new Error("useChat must be used within a ChatProvider");
    return ctx;
};
