/**
 * auth.api.js
 */
import { apiClient } from "./client.js";

export const AuthAPI = {
    login: (email, password) => apiClient.post("/auth/login", { email, password }),
    register: (name, email, password) => apiClient.post("/auth/register", { name, email, password }),
    logout: () => apiClient.post("/auth/logout"),
    getProfile: () => apiClient.get("/users/profile"),
};
