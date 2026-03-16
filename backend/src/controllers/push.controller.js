/**
 * push.controller.js
 * Handles Web Push subscription storage and notification sending.
 * Uses the `web-push` library with VAPID keys from .env
 */
import webpush from "web-push";
import User from "../models/user.model.js";

// Configure VAPID (called once on startup from app.js)
export const initWebPush = () => {
    webpush.setVapidDetails(
        process.env.VAPID_EMAIL || "mailto:admin@videocaller.app",
        process.env.VAPID_PUBLIC_KEY,
        process.env.VAPID_PRIVATE_KEY
    );
};

/** GET /api/v1/push/vapid-public-key — send public key to client */
export const getVapidPublicKey = (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
};

/** POST /api/v1/push/subscribe — save browser push subscription */
export const savePushSubscription = async (req, res) => {
    try {
        const { subscription } = req.body; // { endpoint, keys: { p256dh, auth } }
        if (!subscription?.endpoint) {
            return res.status(400).json({ message: "Invalid subscription object" });
        }

        await User.findByIdAndUpdate(req.user._id, {
            pushSubscription: subscription,
        });

        res.status(201).json({ message: "Push subscription saved" });
    } catch (err) {
        console.error("[Push] Save subscription error:", err.message);
        res.status(500).json({ message: "Failed to save subscription" });
    }
};

/** POST /api/v1/push/unsubscribe — clear push subscription */
export const removePushSubscription = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.user._id, {
            $unset: { pushSubscription: 1 },
        });
        res.json({ message: "Push subscription removed" });
    } catch (err) {
        res.status(500).json({ message: "Failed to remove subscription" });
    }
};

/**
 * Shared helper — send a web push notification to a specific user.
 * Safe to call from socket namespaces; silently removes broken subscriptions.
 *
 * @param {string} userId  - MongoDB ObjectId string
 * @param {string} title
 * @param {string} body
 * @param {string} [url]   - URL to open on click (e.g. "/chat")
 */
export const sendPushToUser = async (userId, title, body, url = "/chat") => {
    try {
        const user = await User.findById(userId, { pushSubscription: 1 });
        if (!user?.pushSubscription?.endpoint) return; // no subscription

        const payload = JSON.stringify({ title, body, url });
        await webpush.sendNotification(user.pushSubscription, payload);
        console.log(`[Push] Sent to ${userId}: ${title}`);
    } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired — clear it
            await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
        } else {
            console.error("[Push] Send error:", err.message);
        }
    }
};
