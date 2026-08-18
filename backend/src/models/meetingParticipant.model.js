/**
 * meetingParticipant.model.js (Stage 1)
 */
import mongoose from "mongoose";

const participantSchema = new mongoose.Schema({
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    role: {
        type: String,
        enum: ["HOST", "CO_HOST", "PARTICIPANT"],
        default: "PARTICIPANT"
    },
    status: {
        type: String,
        enum: ["INVITED", "WAITING", "ADMITTED", "JOINED", "LEFT", "REMOVED"],
        default: "JOINED"
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    leftAt: {
        type: Date
    }
}, { timestamps: true });

// A user should have only one participant record per meeting
participantSchema.index({ meetingId: 1, userId: 1 }, { unique: true });

export default mongoose.model("MeetingParticipant", participantSchema);
