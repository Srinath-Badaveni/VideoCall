import React, { useState, useEffect, useRef } from "react";
import {
    View, Text, TextInput, TouchableOpacity, FlatList,
    StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert
} from "react-native";
import { io } from "socket.io-client";
import { useAuth } from "../contexts/AuthContext";

const SOCKET_URL = "http://localhost:8080"; // use your LAN IP for physical device

const fmtTime = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export default function ChatRoomScreen({ route, navigation }) {
    const { roomId, username } = route.params;
    const { token, user } = useAuth();
    const socketRef = useRef(null);

    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [onlineCount, setOnlineCount] = useState(0);
    const [typingUsers, setTypingUsers] = useState([]);
    const [pendingInvite, setPendingInvite] = useState(null);
    const listRef = useRef(null);
    const typingTimer = useRef(null);

    useEffect(() => {
        // Connect to /chat namespace with JWT auth
        socketRef.current = io(`${SOCKET_URL}/chat`, {
            auth: { token },
            transports: ["websocket"],
        });

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-chat-room", { roomId });
        });

        socketRef.current.on("connect_error", (err) => {
            Alert.alert("Connection Error", err.message);
        });

        socketRef.current.on("message-history", (history) => setMessages(history));
        socketRef.current.on("chat-message", (msg) => setMessages((p) => [...p, msg]));
        socketRef.current.on("room-user-count", ({ count }) => setOnlineCount(count));
        socketRef.current.on("user-joined-chat", ({ username: u, count }) => {
            setOnlineCount(count);
            setMessages((p) => [...p, { system: true, message: `${u} joined`, timestamp: new Date().toISOString() }]);
        });
        socketRef.current.on("user-left-chat", ({ username: u, count }) => {
            setOnlineCount(count);
            setMessages((p) => [...p, { system: true, message: `${u} left`, timestamp: new Date().toISOString() }]);
        });
        socketRef.current.on("typing", ({ username: u }) =>
            setTypingUsers((p) => p.includes(u) ? p : [...p, u])
        );
        socketRef.current.on("stop-typing", ({ username: u }) =>
            setTypingUsers((p) => p.filter((x) => x !== u))
        );

        // Invitation
        socketRef.current.on("receive-invitation", ({ inviteId, fromName, roomId: rm }) => {
            setPendingInvite({ inviteId, fromName, roomId: rm });
        });
        socketRef.current.on("invitation-accepted", ({ byName }) => Alert.alert("✓ Accepted", `${byName} joined!`));
        socketRef.current.on("invitation-rejected", ({ byName }) => Alert.alert("Declined", `${byName} declined your invite.`));

        return () => {
            socketRef.current?.disconnect();
        };
    }, []);

    const sendMessage = () => {
        if (!input.trim()) return;
        socketRef.current?.emit("chat-message", { message: input.trim() });
        setInput("");
        clearTimeout(typingTimer.current);
        socketRef.current?.emit("stop-typing");
    };

    const handleTyping = (text) => {
        setInput(text);
        socketRef.current?.emit("typing");
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => socketRef.current?.emit("stop-typing"), 2000);
    };

    const acceptInvite = () => {
        if (!pendingInvite) return;
        socketRef.current?.emit("accept-invitation", { inviteId: pendingInvite.inviteId });
        setPendingInvite(null);
    };

    const rejectInvite = () => {
        if (!pendingInvite) return;
        socketRef.current?.emit("reject-invitation", { inviteId: pendingInvite.inviteId });
        setPendingInvite(null);
    };

    const renderMessage = ({ item: msg }) => {
        if (msg.system) {
            return (
                <View style={styles.systemMsgRow}>
                    <Text style={styles.systemMsg}>{msg.message}</Text>
                </View>
            );
        }
        const isOwn = msg.sender === user?.name;
        return (
            <View style={[styles.msgRow, isOwn ? styles.msgRowOwn : styles.msgRowOther]}>
                {!isOwn && <Text style={styles.sender}>{msg.sender}</Text>}
                <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
                    <Text style={styles.bubbleText}>{msg.message}</Text>
                </View>
                <Text style={styles.time}>{fmtTime(msg.timestamp)}</Text>
            </View>
        );
    };

    const typingText = typingUsers.length > 0
        ? typingUsers.length === 1 ? `${typingUsers[0]} is typing…` : `${typingUsers.join(", ")} are typing…`
        : null;

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={styles.headerTitle}># {roomId}</Text>
                    <Text style={styles.headerSub}>{onlineCount} online</Text>
                </View>
            </View>

            {/* Invite Toast */}
            {pendingInvite && (
                <View style={styles.inviteToast}>
                    <Text style={styles.inviteText}>
                        <Text style={{ fontWeight: "700", color: "#A78BFA" }}>{pendingInvite.fromName}</Text>
                        {" "}invited you to{" "}
                        <Text style={{ fontWeight: "700", color: "#A78BFA" }}>#{pendingInvite.roomId}</Text>
                    </Text>
                    <View style={styles.inviteBtns}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={acceptInvite}>
                            <Text style={styles.acceptBtnText}>✓ Accept</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn} onPress={rejectInvite}>
                            <Text style={styles.declineBtnText}>✕ Decline</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Messages */}
            <FlatList
                ref={listRef}
                data={messages}
                keyExtractor={(_, i) => i.toString()}
                renderItem={renderMessage}
                contentContainerStyle={styles.messages}
                onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            />

            {/* Typing indicator */}
            {typingText && (
                <Text style={styles.typingText}>{typingText}</Text>
            )}

            {/* Input */}
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
                <View style={styles.inputRow}>
                    <TextInput
                        style={styles.input}
                        placeholder={`Message #${roomId}…`}
                        placeholderTextColor="#6B7280"
                        value={input}
                        onChangeText={handleTyping}
                        multiline
                    />
                    <TouchableOpacity style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={sendMessage} disabled={!input.trim()}>
                        <Text style={styles.sendBtnText}>➤</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#030712" },
    header: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#1F2937", backgroundColor: "#111827", gap: 12 },
    backBtn: { color: "#A78BFA", fontSize: 22 },
    headerCenter: { flex: 1 },
    headerTitle: { color: "#F9FAFB", fontSize: 16, fontWeight: "700" },
    headerSub: { color: "#6B7280", fontSize: 12 },
    messages: { padding: 16, paddingBottom: 4 },
    systemMsgRow: { alignItems: "center", marginVertical: 8 },
    systemMsg: { color: "#4B5563", fontSize: 12, backgroundColor: "#1F2937", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20 },
    msgRow: { marginBottom: 12 },
    msgRowOwn: { alignItems: "flex-end" },
    msgRowOther: { alignItems: "flex-start" },
    sender: { color: "#A78BFA", fontSize: 12, fontWeight: "600", marginBottom: 2, marginLeft: 4 },
    bubble: { maxWidth: "75%", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },
    bubbleOwn: { backgroundColor: "#7C3AED", borderBottomRightRadius: 4 },
    bubbleOther: { backgroundColor: "#1F2937", borderBottomLeftRadius: 4 },
    bubbleText: { color: "#F9FAFB", fontSize: 14, lineHeight: 20 },
    time: { color: "#4B5563", fontSize: 11, marginTop: 2, marginHorizontal: 4 },
    typingText: { color: "#6B7280", fontSize: 12, fontStyle: "italic", paddingHorizontal: 16, paddingBottom: 4 },
    inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#1F2937", backgroundColor: "#111827" },
    input: { flex: 1, backgroundColor: "#1F2937", borderWidth: 1, borderColor: "#374151", borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: "#F9FAFB", fontSize: 14, maxHeight: 100 },
    sendBtn: { backgroundColor: "#7C3AED", width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
    sendBtnDisabled: { opacity: 0.3 },
    sendBtnText: { color: "#fff", fontSize: 18 },
    inviteToast: { backgroundColor: "#1E1B4B", borderWidth: 1, borderColor: "#4338CA", margin: 12, borderRadius: 14, padding: 14 },
    inviteText: { color: "#D1D5DB", fontSize: 14, marginBottom: 10 },
    inviteBtns: { flexDirection: "row", gap: 8 },
    acceptBtn: { flex: 1, backgroundColor: "#16A34A", borderRadius: 10, paddingVertical: 8, alignItems: "center" },
    acceptBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
    declineBtn: { flex: 1, backgroundColor: "#374151", borderRadius: 10, paddingVertical: 8, alignItems: "center" },
    declineBtnText: { color: "#D1D5DB", fontWeight: "700", fontSize: 13 },
});
