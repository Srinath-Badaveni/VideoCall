import express from "express";
import {
    sendFriendRequest,
    respondToRequest,
    getFriends,
    getPendingRequests,
    getSentRequests,
    removeFriend,
} from "../controllers/friend.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All routes protected
router.use(authMiddleware);

router.post("/request", sendFriendRequest);           // Send a friend request by email
router.post("/respond/:id", respondToRequest);        // Accept or reject
router.get("/list", getFriends);                      // Accepted friends
router.get("/pending", getPendingRequests);           // Incoming pending requests
router.get("/sent", getSentRequests);                 // Outgoing pending requests
router.delete("/:id", removeFriend);                  // Remove / cancel

export default router;
