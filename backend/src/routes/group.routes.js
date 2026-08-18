import express from "express";
import * as groupController from "../controllers/group.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All group routes require authentication
router.use(authMiddleware);

// Create a new group
router.post("/", groupController.createGroup);

// Get all groups the user is a member of
router.get("/", groupController.getUserGroups);

// Get a specific group details
router.get("/:groupId", groupController.getGroupDetails);

// Add a member to a group
router.post("/:groupId/members", groupController.addMember);

// Remove a member from a group (or leave group)
router.delete("/:groupId/members/:userId", groupController.removeMember);

// User joins voluntarily via code
router.post("/:groupId/join", groupController.joinGroup);

// Admin features
router.post("/:groupId/admins", groupController.promoteAdmin);
router.delete("/:groupId/admins/:userId", groupController.demoteAdmin);

export default router;
