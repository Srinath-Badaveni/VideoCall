import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        meetingCode: {
            type: String,
            required: true,
        },

        description: String,
        date: {
            type: Date,
            default: Date.now,
            required: true,
        },
    },
    { timestamps: true }
);

const Meeting = mongoose.model("Meeting", meetingSchema);
export default Meeting;
