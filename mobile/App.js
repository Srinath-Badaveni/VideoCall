// Mobile App Navigation Entry Point
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "./screens/LoginScreen";
import SignupScreen from "./screens/SignupScreen";
import DashboardScreen from "./screens/DashboardScreen";
import ChatLobbyScreen from "./screens/ChatLobbyScreen";
import ChatRoomScreen from "./screens/ChatRoomScreen";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

const Stack = createNativeStackNavigator();

function AppNavigator() {
    const { isAuthenticated } = useAuth();
    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {!isAuthenticated ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Dashboard" component={DashboardScreen} />
                        <Stack.Screen name="ChatLobby" component={ChatLobbyScreen} />
                        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <AppNavigator />
        </AuthProvider>
    );
}
