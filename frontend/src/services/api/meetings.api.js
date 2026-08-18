/**
 * meetings.api.js
 */
import { apiClient } from "./client.js";

export const MeetingsAPI = {
    create: (data) => apiClient.post("/meetings", data),
    getByCode: (code) => apiClient.get(`/meetings/${code}`),
    join: (code) => apiClient.post(`/meetings/${code}/join`),
    leave: (code) => apiClient.post(`/meetings/${code}/leave`),
};
