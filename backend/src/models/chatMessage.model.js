/**
 * chatMessage.model.js
 * Persists chat messages (both room and DM) in MongoDB.
 */
import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
    {
        roomId: { type: String, required: true, index: true },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        sender: { type: String, required: true },       // display name at time of sending
        message: { type: String, required: true, maxlength: 4000 },
    },
    {
        timestamps: true,                               // createdAt used as canonical timestamp
    }
);

// Composite index for fast room history queries
chatMessageSchema.index({ roomId: 1, createdAt: -1 });

const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
export default ChatMessage;
