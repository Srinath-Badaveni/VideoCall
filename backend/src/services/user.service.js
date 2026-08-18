/**
 * user.service.js
 */
import User from "../models/user.model.js";
import { NotFoundError } from "../utils/errors.js";

export async function getAllUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    
    const [users, total] = await Promise.all([
        User.find({}, "name email")
            .sort({ name: 1 })
            .skip(skip)
            .limit(limit),
        User.countDocuments()
    ]);
    
    return {
        users,
        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit)
        }
    };
}

export async function getUserById(id) {
    const user = await User.findById(id, "name email");
    if (!user) {
        throw new NotFoundError("User not found");
    }
    return user;
}
