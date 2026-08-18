/**
 * message.repository.js (Stage 1 Stub)
 */
import ChatMessage from "../models/chatMessage.model.js";

export async function create(roomId, senderId, name, text) {
    const message = new ChatMessage({
        roomId,
        sender: senderId,
        name,
        text
    });
    return message.save();
}

export async function findByRoom(roomId, limit, beforeTimestamp) {
    const query = { roomId };
    if (beforeTimestamp) {
        query.timestamp = { $lt: new Date(beforeTimestamp) };
    }
    
    return ChatMessage.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("sender", "name email");
}
