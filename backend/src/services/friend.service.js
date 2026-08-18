/**
 * friend.service.js
 */
import Friendship from "../models/friendship.model.js";
import User from "../models/user.model.js";
import { NotFoundError, ConflictError } from "../utils/errors.js";
import { sendPushToUser } from "../controllers/push.controller.js"; // will migrate to push service soon

export async function sendFriendRequest(requesterId, recipientEmail) {
    const recipient = await User.findOne({ email: recipientEmail });
    if (!recipient) {
        throw new NotFoundError("User not found with this email");
    }
    
    if (recipient._id.toString() === requesterId.toString()) {
        throw new ConflictError("You cannot send a friend request to yourself");
    }
    
    const existing = await Friendship.findOne({
        $or: [
            { requester: requesterId, recipient: recipient._id },
            { requester: recipient._id, recipient: requesterId }
        ]
    });
    
    if (existing) {
        throw new ConflictError("Friend request already exists or you are already friends");
    }
    
    const request = new Friendship({
        requester: requesterId,
        recipient: recipient._id,
        status: "pending"
    });
    
    await request.save();
    
    // Notify recipient
    const requester = await User.findById(requesterId);
    sendPushToUser(recipient._id.toString(), "New Friend Request", `${requester.name} sent you a friend request!`, "/friends");
    
    return request;
}
