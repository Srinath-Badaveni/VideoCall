import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:8080/api/v1"; // Use your machine IP for physical device

export default function LoginScreen({ navigation }) {
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            Alert.alert("Error", "Please enter email and password");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/users/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim(), password }),
            });
            const data = await res.json();
            if (res.ok) {
                await login(data.token, data.user);
            } else {
                Alert.alert("Login Failed", data.message || "Invalid credentials");
            }
        } catch (err) {
            Alert.alert("Network Error", "Could not reach the server. Check your connection.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={styles.container}
            >
                {/* Logo */}
                <View style={styles.logoBox}>
                    <Text style={styles.logoIcon}>💬</Text>
                    <Text style={styles.logoText}>VideoCaller Pro</Text>
                    <Text style={styles.tagline}>Sign in to your account</Text>
                </View>

                <View style={styles.card}>
                    <Text style={styles.label}>Email</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="you@example.com"
                        placeholderTextColor="#6B7280"
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                    />

                    <Text style={styles.label}>Password</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="••••••••"
                        placeholderTextColor="#6B7280"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity
                        style={[styles.btn, loading && styles.btnDisabled]}
                        onPress={handleLogin}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.btnText}>Sign In</Text>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate("Signup")}
                        style={styles.link}
                    >
                        <Text style={styles.linkText}>
                            Don't have an account?{" "}
                            <Text style={styles.linkHighlight}>Sign Up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1, backgroundColor: "#030712" },
    container: { flex: 1, justifyContent: "center", paddingHorizontal: 24 },
    logoBox: { alignItems: "center", marginBottom: 32 },
    logoIcon: { fontSize: 48, marginBottom: 8 },
    logoText: { fontSize: 28, fontWeight: "800", color: "#A78BFA", letterSpacing: -0.5 },
    tagline: { color: "#6B7280", marginTop: 4, fontSize: 14 },
    card: {
        backgroundColor: "#111827", borderRadius: 20, padding: 24,
        borderWidth: 1, borderColor: "#1F2937",
    },
    label: { color: "#D1D5DB", fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
    input: {
        backgroundColor: "#1F2937", borderWidth: 1, borderColor: "#374151",
        borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
        color: "#F9FAFB", fontSize: 15, marginBottom: 16,
    },
    btn: {
        backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 15,
        alignItems: "center", marginTop: 4,
    },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    link: { marginTop: 16, alignItems: "center" },
    linkText: { color: "#6B7280", fontSize: 14 },
    linkHighlight: { color: "#A78BFA", fontWeight: "700" },
});
