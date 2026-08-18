/**
 * meetingRoom.model.js (Stage 1)
 */
import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    meetingId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Meeting",
        required: true
    },
    name: {
        type: String,
        default: "Main Room"
    },
    type: {
        type: String,
        enum: ["MAIN", "BREAKOUT"],
        default: "MAIN"
    },
    capacity: {
        type: Number,
        default: 100
    },
    closedAt: {
        type: Date
    }
}, { timestamps: true });

export default mongoose.model("MeetingRoom", roomSchema);
