/**
 * sockets/auth.js
 */
import jwt from "jsonwebtoken";
import config from "../config/env.js";

export const socketAuthMiddleware = (socket, next) => {
    const token = socket.handshake.auth?.token;
    
    if (!token) {
        return next(new Error("Authentication required: no token supplied"));
    }
    
    try {
        const decoded = jwt.verify(token, config.jwtSecret);
        socket.user = decoded;
        next();
    } catch (error) {
        return next(new Error("Authentication required: invalid token"));
    }
};
