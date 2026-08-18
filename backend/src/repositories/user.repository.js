/**
 * user.repository.js (Stage 1 Stub)
 * 
 * DESIGN: Thin wrappers around DB models to abstract away Mongoose
 * logic. In Stage 2 this will switch to Prisma.
 */
import User from "../models/user.model.js";

export async function findById(id) {
    return User.findById(id);
}

export async function findByEmail(email) {
    return User.findOne({ email });
}

export async function create(userData) {
    const user = new User(userData);
    return user.save();
}

export async function updatePushSubscription(userId, subscription) {
    return User.findByIdAndUpdate(userId, { pushSubscription: subscription });
}
