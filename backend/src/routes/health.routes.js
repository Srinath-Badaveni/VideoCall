/**
 * health.routes.js
 */
import { Router } from "express";
import { checkHealth } from "../controllers/health.controller.js";
import { asyncHandler } from "../middleware/errorHandler.js";

const router = Router();

router.get("/", asyncHandler(checkHealth));

export default router;
