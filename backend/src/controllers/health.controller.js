/**
 * health.controller.js
 */
import mongoose from "mongoose";

export const checkHealth = async (req, res) => {
    res.status(200).json({
        success: true,
        data: {
            status: "ok",
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
        }
    });
};
