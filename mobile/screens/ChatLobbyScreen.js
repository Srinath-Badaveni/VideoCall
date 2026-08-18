import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function ChatLobbyScreen({ navigation }) {
    const { user } = useAuth();
    const [roomId, setRoomId] = useState("");

    const handleJoin = () => {
        if (!roomId.trim()) return;
        navigation.navigate("ChatRoom", { roomId: roomId.trim(), username: user?.name });
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()}>
                    <Text style={styles.backText}>← Back</Text>
                </TouchableOpacity>

                <View style={styles.center}>
                    <Text style={styles.icon}>💬</Text>
                    <Text style={styles.title}>Live Chat</Text>
                    <Text style={styles.sub}>Members-only real-time rooms</Text>
                </View>

                <View style={styles.card}>
                    {/* User badge */}
                    <View style={styles.userBadge}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                        </View>
                        <View>
                            <Text style={styles.userName}>{user?.name}</Text>
                            <Text style={styles.userEmail}>{user?.email}</Text>
                        </View>
                        <View style={styles.onlinePill}>
                            <Text style={styles.onlinePillText}>● Online</Text>
                        </View>
                    </View>

                    <Text style={styles.label}>Room Name</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="e.g. general, team-alpha"
                        placeholderTextColor="#6B7280"
                        value={roomId}
                        onChangeText={setRoomId}
                        autoCapitalize="none"
                        onSubmitEditing={handleJoin}
                    />

                    <TouchableOpacity
                        style={[styles.btn, !roomId.trim() && styles.btnDisabled]}
                        onPress={handleJoin}
                        disabled={!roomId.trim()}
                    >
                        <Text style={styles.btnText}>Start Chatting →</Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#030712" },
    container: { flex: 1, paddingHorizontal: 24, paddingTop: 20 },
    back: { marginBottom: 16 },
    backText: { color: "#A78BFA", fontSize: 15, fontWeight: "600" },
    center: { alignItems: "center", marginBottom: 28 },
    icon: { fontSize: 52, marginBottom: 8 },
    title: { fontSize: 28, fontWeight: "800", color: "#A78BFA" },
    sub: { color: "#6B7280", fontSize: 14, marginTop: 4 },
    card: { backgroundColor: "#111827", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#1F2937" },
    userBadge: {
        flexDirection: "row", alignItems: "center", gap: 10,
        backgroundColor: "#1a1040", borderRadius: 12, padding: 12, marginBottom: 20,
        borderWidth: 1, borderColor: "#4c1d9540",
    },
    avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center" },
    avatarText: { color: "#fff", fontWeight: "700" },
    userName: { color: "#F9FAFB", fontWeight: "600", fontSize: 14 },
    userEmail: { color: "#6B7280", fontSize: 12 },
    onlinePill: { marginLeft: "auto", backgroundColor: "#14532d40", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "#16a34a50" },
    onlinePillText: { color: "#4ade80", fontSize: 12, fontWeight: "600" },
    label: { color: "#D1D5DB", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8 },
    input: { backgroundColor: "#1F2937", borderWidth: 1, borderColor: "#374151", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#F9FAFB", fontSize: 15, marginBottom: 16 },
    btn: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 15, alignItems: "center" },
    btnDisabled: { opacity: 0.4 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
