import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
            default: "",
        },
        // Group creator is the initial admin
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Members inside the group (including admins)
        members: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
        // Users who have admin privileges
        admins: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            }
        ],
    },
    { timestamps: true }
);

// Indexes for faster lookups when querying user's groups
groupSchema.index({ members: 1 });

const Group = mongoose.model("Group", groupSchema);
export default Group;
