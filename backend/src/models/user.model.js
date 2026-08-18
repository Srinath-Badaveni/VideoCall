import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import config from "../config/env.js";

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
    // Web Push subscription (stored after user grants notification permission)
    pushSubscription: {
        type: Object,
        default: null,
    },
});

// Method to generate JWT token
userSchema.methods.generateAuthToken = function () {
    const token = jwt.sign(
        { _id: this._id, email: this.email, name: this.name },
        config.jwtSecret,
        { expiresIn: config.jwtExpiresIn }
    );
    return token;
};

const User = mongoose.model("User", userSchema);
export default User;

