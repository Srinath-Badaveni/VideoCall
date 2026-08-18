/**
 * chat.service.js
 */
import ChatMessage from "../models/chatMessage.model.js";
import { NotFoundError } from "../utils/errors.js";

export async function saveMessage(roomId, senderId, name, text) {
    const message = new ChatMessage({
        roomId,
        sender: senderId,
        name,
        text
    });
    await message.save();
    return message;
}

export async function getMessageHistory(roomId, limit = 50, before = null) {
    const query = { roomId };
    if (before) {
        query.timestamp = { $lt: new Date(before) };
    }
    
    const messages = await ChatMessage.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .populate("sender", "name email");
        
    return messages.reverse();
}
