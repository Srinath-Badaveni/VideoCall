import React, { useState } from "react";
import {
    View, Text, TextInput, TouchableOpacity,
    StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator
} from "react-native";
import { useAuth } from "../contexts/AuthContext";

const API = "http://localhost:8080/api/v1";

export default function SignupScreen({ navigation }) {
    const { login } = useAuth();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async () => {
        if (!name.trim() || !email.trim() || !password.trim()) {
            Alert.alert("Error", "All fields are required");
            return;
        }
        setLoading(true);
        try {
            const res = await fetch(`${API}/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
            });
            const data = await res.json();
            if (res.ok) {
                await login(data.token, data.user);
            } else {
                Alert.alert("Registration Failed", data.message || "Try again");
            }
        } catch {
            Alert.alert("Network Error", "Could not reach the server.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safe}>
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.container}>
                <View style={styles.logoBox}>
                    <Text style={styles.logoIcon}>💬</Text>
                    <Text style={styles.logoText}>Create Account</Text>
                    <Text style={styles.tagline}>Join VideoCaller Pro</Text>
                </View>

                <View style={styles.card}>
                    {[
                        { label: "Full Name", value: name, setter: setName, placeholder: "Alice Smith" },
                        { label: "Email", value: email, setter: setEmail, placeholder: "alice@example.com", keyboard: "email-address" },
                        { label: "Password", value: password, setter: setPassword, placeholder: "••••••••", secure: true },
                    ].map(({ label, value, setter, placeholder, keyboard, secure }) => (
                        <View key={label}>
                            <Text style={styles.label}>{label}</Text>
                            <TextInput
                                style={styles.input}
                                placeholder={placeholder}
                                placeholderTextColor="#6B7280"
                                value={value}
                                onChangeText={setter}
                                keyboardType={keyboard || "default"}
                                autoCapitalize="none"
                                secureTextEntry={!!secure}
                            />
                        </View>
                    ))}

                    <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handleSignup} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Create Account</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Login")} style={styles.link}>
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkHighlight}>Sign In</Text>
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
    logoBox: { alignItems: "center", marginBottom: 28 },
    logoIcon: { fontSize: 44, marginBottom: 6 },
    logoText: { fontSize: 26, fontWeight: "800", color: "#A78BFA" },
    tagline: { color: "#6B7280", marginTop: 4, fontSize: 14 },
    card: { backgroundColor: "#111827", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: "#1F2937" },
    label: { color: "#D1D5DB", fontSize: 12, fontWeight: "600", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.8 },
    input: { backgroundColor: "#1F2937", borderWidth: 1, borderColor: "#374151", borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, color: "#F9FAFB", fontSize: 15, marginBottom: 14 },
    btn: { backgroundColor: "#7C3AED", borderRadius: 12, paddingVertical: 15, alignItems: "center", marginTop: 4 },
    btnDisabled: { opacity: 0.5 },
    btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
    link: { marginTop: 16, alignItems: "center" },
    linkText: { color: "#6B7280", fontSize: 14 },
    linkHighlight: { color: "#A78BFA", fontWeight: "700" },
});
