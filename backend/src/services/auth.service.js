/**
 * auth.service.js — Authentication business logic.
 *
 * Extracted from user.controller.js so controllers stay thin.
 * Handles password hashing, token generation, user creation.
 */
import bcrypt from "bcrypt";
import User from "../models/user.model.js";
import {
    BadRequestError,
    ConflictError,
    NotFoundError,
    UnauthorizedError,
} from "../utils/errors.js";

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * @returns {{ user: object, token: string }}
 */
export async function registerUser({ name, email, password }) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ConflictError("User already exists with this email", "USER_EXISTS");
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = new User({ name, email, password: hashedPassword });
    await user.save();

    const token = user.generateAuthToken();

    return {
        user: { _id: user._id, name: user.name, email: user.email },
        token,
    };
}

/**
 * Authenticate a user by email and password.
 * @returns {{ user: object, token: string }}
 */
export async function loginUser({ email, password }) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new UnauthorizedError("Invalid credentials", "INVALID_CREDENTIALS");
    }

    const token = user.generateAuthToken();

    return {
        user: { _id: user._id, name: user.name, email: user.email },
        token,
    };
}

/**
 * Get a user's profile by ID.
 * @returns {object} User profile
 */
export async function getUserProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
        throw new NotFoundError("User not found", "USER_NOT_FOUND");
    }

    return { _id: user._id, name: user.name, email: user.email };
}
