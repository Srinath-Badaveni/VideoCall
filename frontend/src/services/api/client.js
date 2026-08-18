/**
 * client.js
 * 
 * Centralized Axios API client with interceptors for token injection
 * and global error handling.
 */
import axios from "axios";

const API_URL = process.env.REACT_APP_SERVER_URL || "http://localhost:8080";

export const apiClient = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
        "Content-Type": "application/json",
    },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle global errors (e.g., 401 Unauthorized)
apiClient.interceptors.response.use(
    (response) => response.data,
    (error) => {
        if (error.response?.status === 401) {
            // Handle token expiration globally
            localStorage.removeItem("token");
            window.location.href = "/login";
        }
        return Promise.reject(error.response?.data || error.message);
    }
);
