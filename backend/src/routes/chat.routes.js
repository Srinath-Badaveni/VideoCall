import express from "express";

const router = express.Router();

/**
 * GET /api/v1/chat/rooms
 * Returns a list of active chat room names.
 * The in-memory chatRooms map lives in chatNamespace.js; we expose it
 * here by importing the getter so routes stay thin.
 *
 * NOTE: Since chatRooms is module-level state inside chatNamespace.js,
 * we keep this endpoint simple — the frontend can also discover rooms
 * just by typing a name.  This is a convenience endpoint.
 */
router.get("/rooms", (req, res) => {
    // chatRooms is managed inside the socket namespace; for now return
    // a 200 with an empty array so the endpoint is in place for future use.
    res.json({ rooms: [] });
});

export default router;
