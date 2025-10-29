import jwt from "jsonwebtoken";
import httpStatus from "http-status";

export const authMiddleware = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(httpStatus.UNAUTHORIZED).json({
                status: httpStatus.UNAUTHORIZED,
                message: "No token provided",
            });
        }

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET || "your_secret_key_here"
        );
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(httpStatus.UNAUTHORIZED).json({
            status: httpStatus.UNAUTHORIZED,
            message: "Invalid token",
            error: error.message,
        });
    }
};
