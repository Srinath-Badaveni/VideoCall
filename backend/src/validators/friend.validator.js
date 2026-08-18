/**
 * friend.validator.js — Zod schemas for friend endpoints.
 */
import { z } from "zod";

export const sendFriendRequestSchema = z.object({
    body: z.object({
        email: z
            .string({ required_error: "Email is required" })
            .trim()
            .email("Invalid email address")
            .toLowerCase(),
    }),
});

export const respondToRequestSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Request ID is required" }),
    }),
    body: z.object({
        action: z.enum(["accept", "reject"], {
            required_error: "Action is required",
            invalid_type_error: "Action must be 'accept' or 'reject'",
        }),
    }),
});

export const removeFriendSchema = z.object({
    params: z.object({
        id: z.string({ required_error: "Friendship ID is required" }),
    }),
});
