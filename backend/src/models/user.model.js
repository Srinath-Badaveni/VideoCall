import mongoose from "mongoose";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        { _id: this._id, email: this.email, name: this.name },
        process.env.JWT_SECRET || "your_secret_key_here",
        { expiresIn: "7d" }
    );
    return token;
};

const User = mongoose.model("User", userSchema);
export default User;
