import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                error: { code: "NO_TOKEN", message: "No token provided" },
            });
        }

        const decoded = jwt.verify(token, config.jwtSecret);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            error: { code: "INVALID_TOKEN", message: "Invalid or expired token" },
        });
    }
};
