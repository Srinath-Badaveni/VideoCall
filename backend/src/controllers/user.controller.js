import User from "../models/user.model.js";
import httpStatus from "http-status";
import bcrypt from "bcrypt";

// 🧩 REGISTER CONTROLLER
export const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                status: httpStatus.BAD_REQUEST,
                message: "All fields are required",
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(httpStatus.CONFLICT).json({
                status: httpStatus.CONFLICT,
                message: "User already exists with this email",
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        // Generate token
        const token = user.generateAuthToken();

        // Send response
        res.status(httpStatus.CREATED).json({
            status: httpStatus.CREATED,
            message: "User registered successfully",
            token: token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Register Error:", error.message);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: "Server error",
            error: error.message,
        });
    }
};

// 🧩 LOGIN CONTROLLER
export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(httpStatus.BAD_REQUEST).json({
                status: httpStatus.BAD_REQUEST,
                message: "Email and password are required",
            });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                status: httpStatus.NOT_FOUND,
                message: "User not found",
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                status: httpStatus.UNAUTHORIZED,
                message: "Invalid credentials",
            });
        }

        // Generate token
        const token = user.generateAuthToken();

        // Send response
        res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: "Login successful",
            token: token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Login Error:", error.message);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: "Server error",
            error: error.message,
        });
    }
};

// 🧩 GET PROFILE (Protected Route Example)
export const getUserProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(httpStatus.NOT_FOUND).json({
                status: httpStatus.NOT_FOUND,
                message: "User not found",
            });
        }

        res.status(httpStatus.OK).json({
            status: httpStatus.OK,
            message: "User profile fetched successfully",
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
            },
        });
    } catch (error) {
        console.error("Get Profile Error:", error.message);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: "Server error",
            error: error.message,
        });
    }
};

// 🧩 GET ALL USERS (Protected — for invite / user-list sidebar)
export const getAllUsers = async (req, res) => {
    try {
        const users = await User.find(
            { _id: { $ne: req.user._id } }, // exclude the requesting user
            { name: 1, email: 1 }
        ).sort({ name: 1 });

        res.status(httpStatus.OK).json({ status: httpStatus.OK, users });
    } catch (error) {
        console.error("Get All Users Error:", error.message);
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
            status: httpStatus.INTERNAL_SERVER_ERROR,
            message: "Server error",
            error: error.message,
        });
    }
};
