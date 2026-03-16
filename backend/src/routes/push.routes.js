import express from "express";
import {
    getVapidPublicKey,
    savePushSubscription,
    removePushSubscription,
} from "../controllers/push.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public: return VAPID public key so browser can subscribe
router.get("/vapid-public-key", getVapidPublicKey);

// Protected: store / remove subscription
router.post("/subscribe", authMiddleware, savePushSubscription);
router.post("/unsubscribe", authMiddleware, removePushSubscription);

export default router;
