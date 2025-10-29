import React, { createContext, useState, useContext, useEffect } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem("token") || null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if token exists on mount
        const storedToken = localStorage.getItem("token");
        if (storedToken) {
            setToken(storedToken);
            setIsAuthenticated(true);
            // Optional: Fetch user profile
            fetchUserProfile(storedToken);
        }
    }, []);

    const fetchUserProfile = async (authToken) => {
        try {
            const response = await fetch(
                "http://localhost:8080/api/v1/users/profile",
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else {
                // Token invalid, clear it
                logout();
            }
        } catch (error) {
            console.error("Fetch profile error:", error);
        }
    };

    const login = (authToken, userData) => {
        setToken(authToken);
        setUser(userData);
        setIsAuthenticated(true);
        localStorage.setItem("token", authToken);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
