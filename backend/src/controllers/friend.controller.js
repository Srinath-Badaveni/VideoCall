/**
 * friend.controller.js
 * All friendship CRUD operations.
 */
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import httpStatus from "http-status";

// ── Utility: find the other user in a friendship ────────────────────────────
function otherUser(friendship, myId) {
    return friendship.requester._id.toString() === myId.toString()
        ? friendship.recipient
        : friendship.requester;
}

// ── POST /api/v1/friends/request ────────────────────────────────────────────
// Body: { email }
export const sendFriendRequest = async (req, res) => {
    try {
        const { email } = req.body;
        const myId = req.user._id;

        if (!email) {
            return res.status(400).json({ message: "Email is required" });
        }

        // Find recipient
        const recipient = await User.findOne({ email: email.toLowerCase().trim() });
        if (!recipient) {
            return res.status(404).json({ message: "No user found with that email" });
        }

        if (recipient._id.toString() === myId.toString()) {
            return res.status(400).json({ message: "You cannot add yourself as a friend" });
        }

        // Check for existing relationship (either direction)
        const existing = await Friendship.findOne({
            $or: [
                { requester: myId, recipient: recipient._id },
                { requester: recipient._id, recipient: myId },
            ],
        });

        if (existing) {
            const msg =
                existing.status === "accepted"
                    ? "You are already friends"
                    : existing.status === "pending"
                    ? "A friend request already exists"
                    : "A previous request was rejected";
            return res.status(409).json({ message: msg, status: existing.status });
        }

        const friendship = await Friendship.create({ requester: myId, recipient: recipient._id });

        res.status(201).json({
            message: "Friend request sent",
            friendship: {
                _id: friendship._id,
                recipient: { _id: recipient._id, name: recipient.name, email: recipient.email },
                status: friendship.status,
            },
        });
    } catch (err) {
        console.error("[Friends] sendFriendRequest error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ── POST /api/v1/friends/respond/:id ────────────────────────────────────────
// Body: { action: 'accept' | 'reject' }
export const respondToRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const { action } = req.body;
        const myId = req.user._id;

        if (!["accept", "reject"].includes(action)) {
            return res.status(400).json({ message: "action must be 'accept' or 'reject'" });
        }

        const friendship = await Friendship.findById(id)
            .populate("requester", "name email")
            .populate("recipient", "name email");

        if (!friendship) {
            return res.status(404).json({ message: "Friend request not found" });
        }

        // Only the recipient can respond
        if (friendship.recipient._id.toString() !== myId.toString()) {
            return res.status(403).json({ message: "Not authorised to respond to this request" });
        }

        if (friendship.status !== "pending") {
            return res.status(400).json({ message: "Request already resolved" });
        }

        friendship.status = action === "accept" ? "accepted" : "rejected";
        await friendship.save();

        res.json({ message: `Friend request ${friendship.status}`, friendship });
    } catch (err) {
        console.error("[Friends] respondToRequest error:", err.message);
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ── GET /api/v1/friends/list ─────────────────────────────────────────────────
// Returns accepted friends of the requesting user
export const getFriends = async (req, res) => {
    try {
        const myId = req.user._id;

        const friendships = await Friendship.find({
            $or: [{ requester: myId }, { recipient: myId }],
            status: "accepted",
        })
            .populate("requester", "name email")
            .populate("recipient", "name email");

        const friends = friendships.map((f) => {
            const other = otherUser(f, myId);
            return { friendshipId: f._id, _id: other._id, name: other.name, email: other.email };
        });

        res.json({ friends });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ── GET /api/v1/friends/pending ───────────────────────────────────────────────
// Returns incoming pending friend requests (where I am the recipient)
export const getPendingRequests = async (req, res) => {
    try {
        const myId = req.user._id;

        const requests = await Friendship.find({ recipient: myId, status: "pending" }).populate(
            "requester",
            "name email"
        );

        res.json({ requests });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ── GET /api/v1/friends/sent ──────────────────────────────────────────────────
// Returns outgoing pending requests (so UI can show "Pending" state)
export const getSentRequests = async (req, res) => {
    try {
        const myId = req.user._id;
        const requests = await Friendship.find({ requester: myId, status: "pending" }).populate(
            "recipient",
            "name email"
        );
        res.json({ requests });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ── DELETE /api/v1/friends/:id ────────────────────────────────────────────────
export const removeFriend = async (req, res) => {
    try {
        const { id } = req.params;
        const myId = req.user._id;

        const friendship = await Friendship.findById(id);
        if (!friendship) return res.status(404).json({ message: "Not found" });

        // Only parties in the friendship can remove it
        if (
            friendship.requester.toString() !== myId.toString() &&
            friendship.recipient.toString() !== myId.toString()
        ) {
            return res.status(403).json({ message: "Not authorised" });
        }

        await friendship.deleteOne();
        res.json({ message: "Friend removed" });
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

// ── Helper: check if two users are friends (for use in socket layer) ─────────
export const areFriends = async (userId1, userId2) => {
    const f = await Friendship.findOne({
        $or: [
            { requester: userId1, recipient: userId2 },
            { requester: userId2, recipient: userId1 },
        ],
        status: "accepted",
    });
    return !!f;
};
