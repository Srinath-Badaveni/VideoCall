/**
 * meeting.model.js (Stage 1 Update)
 */
import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema({
    meetingCode: {
        type: String,
        required: true,
        unique: true
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        default: "New Meeting"
    },
    status: {
        type: String,
        enum: ["SCHEDULED", "ACTIVE", "ENDED", "CANCELLED"],
        default: "SCHEDULED"
    },
    passwordHash: {
        type: String
    },
    maxParticipants: {
        type: Number,
        default: 100
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    waitingRoomEnabled: {
        type: Boolean,
        default: false
    },
    scheduledAt: {
        type: Date
    },
    startedAt: {
        type: Date
    },
    endedAt: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.model("Meeting", meetingSchema);
