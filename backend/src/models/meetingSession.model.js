/**
 * meetingSession.model.js (Stage 1)
 */
import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MeetingParticipant",
        required: true
    },
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    deviceInfo: {
        type: String
    },
    connectionState: {
        type: String,
        enum: ["CONNECTING", "CONNECTED", "RECONNECTING", "DISCONNECTED"],
        default: "CONNECTED"
    },
    reconnectCount: {
        type: Number,
        default: 0
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.model("MeetingSession", sessionSchema);
