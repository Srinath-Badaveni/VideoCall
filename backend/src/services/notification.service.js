/**
 * notification.service.js
 */
import webpush from "web-push";
import User from "../models/user.model.js";
import config from "../config/env.js";
import logger from "../utils/logger.js";

export async function sendPushNotification(userId, title, body, url = "/") {
    try {
        const user = await User.findById(userId);
        if (!user || !user.pushSubscription) return;

        const payload = JSON.stringify({ title, body, url });
        await webpush.sendNotification(user.pushSubscription, payload);
        logger.info({ userId }, `[Push] Sent: ${title}`);
    } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
            // Subscription expired/unsubscribed
            await User.findByIdAndUpdate(userId, { $unset: { pushSubscription: 1 } });
            logger.info({ userId }, "[Push] Cleaned up expired subscription");
        } else {
            logger.error({ err, userId }, "[Push] Failed to send push");
        }
    }
}
