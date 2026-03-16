import express from "express";
import {
    registerUser,
    loginUser,
    getUserProfile,
    getAllUsers,
} from "../controllers/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected routes
router.get("/profile", authMiddleware, getUserProfile);
router.get("/all", authMiddleware, getAllUsers);

export default router;
