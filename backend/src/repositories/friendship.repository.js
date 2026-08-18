/**
 * friendship.repository.js (Stage 1 Stub)
 */
import Friendship from "../models/friendship.model.js";

export async function findExisting(userId1, userId2) {
    return Friendship.findOne({
        $or: [
            { requester: userId1, recipient: userId2 },
            { requester: userId2, recipient: userId1 }
        ]
    });
}

export async function create(requesterId, recipientId) {
    const friendship = new Friendship({
        requester: requesterId,
        recipient: recipientId,
        status: "pending"
    });
    return friendship.save();
}

export async function findPendingForUser(userId) {
    return Friendship.find({ recipient: userId, status: "pending" })
        .populate("requester", "name email");
}
