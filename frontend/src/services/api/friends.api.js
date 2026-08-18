/**
 * friends.api.js
 */
import { apiClient } from "./client.js";

export const FriendsAPI = {
    getFriends: () => apiClient.get("/friends/list"),
    getPendingRequests: () => apiClient.get("/friends/pending"),
    sendRequest: (email) => apiClient.post("/friends/request", { email }),
    respondToRequest: (requestId, action) => apiClient.post(`/friends/respond/${requestId}`, { action }),
    removeFriend: (friendId) => apiClient.delete(`/friends/${friendId}`),
};
