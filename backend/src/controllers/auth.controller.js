/**
 * auth.controller.js
 */
import * as authService from "../services/auth.service.js";

export const register = async (req, res) => {
    const { name, email, password } = req.body;
    const { user, token } = await authService.registerUser({ name, email, password });
    
    res.status(201).json({
        success: true,
        data: { user, token },
        message: "Registration successful"
    });
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    const { user, token } = await authService.loginUser({ email, password });
    
    res.status(200).json({
        success: true,
        data: { user, token },
        message: "Login successful"
    });
};

export const logout = async (req, res) => {
    // In Stage 2, this will invalidate the refresh token in Redis/DB
    // For now, it just returns success
    res.status(200).json({
        success: true,
        message: "Logout successful"
    });
};
