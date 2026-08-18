import React from "react";
import {
    View, Text, TouchableOpacity,
    StyleSheet, SafeAreaView, ScrollView
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

export default function DashboardScreen({ navigation }) {
    const { user, logout } = useAuth();

    const Card = ({ icon, title, desc, btnLabel, btnColor, onPress }) => (
        <View style={styles.card}>
            <View style={styles.cardLeft}>
                <Text style={styles.cardIcon}>{icon}</Text>
                <View>
                    <Text style={styles.cardTitle}>{title}</Text>
                    <Text style={styles.cardDesc}>{desc}</Text>
                </View>
            </View>
            <TouchableOpacity style={[styles.cardBtn, { backgroundColor: btnColor }]} onPress={onPress}>
                <Text style={styles.cardBtnText}>{btnLabel}</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.safe}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>VideoCaller Pro</Text>
                <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
                    <Text style={styles.logoutText}>Logout</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                {/* Greeting */}
                <View style={styles.greeting}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
                    </View>
                    <View>
                        <Text style={styles.greetTitle}>Welcome back 👋</Text>
                        <Text style={styles.greetName}>{user?.name}</Text>
                    </View>
                </View>

                {/* Action Cards */}
                <Text style={styles.sectionTitle}>What would you like to do?</Text>

                <Card
                    icon="🎥"
                    title="New Meeting"
                    desc="Start a video call and share the room ID"
                    btnLabel="Create"
                    btnColor="#2563EB"
                    onPress={() => {}} // Video WebRTC requires a separate native setup
                />
                <Card
                    icon="🔗"
                    title="Join Meeting"
                    desc="Enter a room ID to join an existing call"
                    btnLabel="Join"
                    btnColor="#16A34A"
                    onPress={() => {}}
                />
                <Card
                    icon="💬"
                    title="Live Chat"
                    desc="Real-time chat rooms — no camera needed"
                    btnLabel="Chat →"
                    btnColor="#7C3AED"
                    onPress={() => navigation.navigate("ChatLobby")}
                />

                {/* Info box */}
                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        📱 Video calling requires the web app. The mobile app provides full real-time chat with invitations and push notifications.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#030712" },
    header: {
        flexDirection: "row", justifyContent: "space-between", alignItems: "center",
        paddingHorizontal: 20, paddingVertical: 16,
        borderBottomWidth: 1, borderBottomColor: "#1F2937", backgroundColor: "#111827",
    },
    headerTitle: { color: "#fff", fontSize: 18, fontWeight: "700" },
    logoutBtn: { backgroundColor: "#DC2626", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 8 },
    logoutText: { color: "#fff", fontSize: 13, fontWeight: "600" },
    content: { padding: 20 },
    greeting: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },
    avatar: {
        width: 48, height: 48, borderRadius: 24,
        backgroundColor: "#7C3AED", alignItems: "center", justifyContent: "center",
    },
    avatarText: { color: "#fff", fontSize: 20, fontWeight: "700" },
    greetTitle: { color: "#9CA3AF", fontSize: 13 },
    greetName: { color: "#F9FAFB", fontSize: 20, fontWeight: "700" },
    sectionTitle: { color: "#6B7280", fontSize: 12, fontWeight: "600", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 },
    card: {
        backgroundColor: "#111827", borderRadius: 16, padding: 16,
        marginBottom: 12, borderWidth: 1, borderColor: "#1F2937",
        flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    },
    cardLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
    cardIcon: { fontSize: 28 },
    cardTitle: { color: "#F9FAFB", fontSize: 15, fontWeight: "600" },
    cardDesc: { color: "#6B7280", fontSize: 12, marginTop: 2, width: 170 },
    cardBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
    cardBtnText: { color: "#fff", fontSize: 13, fontWeight: "700" },
    infoBox: {
        backgroundColor: "#1E1B4B", borderRadius: 12, padding: 14,
        marginTop: 8, borderWidth: 1, borderColor: "#4338CA33",
    },
    infoText: { color: "#A5B4FC", fontSize: 13, lineHeight: 20 },
});
