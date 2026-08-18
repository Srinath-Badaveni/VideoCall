/**
 * meeting.routes.js
 */
import { Router } from "express";
import { create, getByCode, join, leave, getToken } from "../controllers/meeting.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = Router();

router.use(authMiddleware);

router.post("/", asyncHandler(create));
router.get("/:code", asyncHandler(getByCode));
router.get("/:code/token", asyncHandler(getToken));
router.post("/:code/join", asyncHandler(join));
router.post("/:code/leave", asyncHandler(leave));

export default router;
