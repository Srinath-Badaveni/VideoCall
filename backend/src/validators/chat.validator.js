/**
 * chat.validator.js — Zod schemas for chat endpoints and socket payloads.
 */
import { z } from "zod";

export const chatMessageSchema = z.object({
    message: z
        .string({ required_error: "Message is required" })
        .trim()
        .min(1, "Message cannot be empty")
        .max(4000, "Message must be 4000 characters or less"),
});

export const joinRoomSchema = z.object({
    roomId: z
        .string({ required_error: "Room ID is required" })
        .trim()
        .min(1, "Room ID is required")
        .max(200, "Room ID too long"),
});
