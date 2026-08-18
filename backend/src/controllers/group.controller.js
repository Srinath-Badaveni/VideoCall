import Group from "../models/group.model.js";
import User from "../models/user.model.js";

// Helper to check if a user is an admin of a group
const isGroupAdmin = (group, userId) => {
    return group.admins.some(adminId => adminId.toString() === userId.toString());
};

export const createGroup = async (req, res) => {
    try {
        const { name, description } = req.body;
        const userId = req.user._id;

        if (!name) {
            return res.status(400).json({ success: false, message: "Group name is required" });
        }

        const newGroup = new Group({
            name,
            description: description || "",
            creatorId: userId,
            members: [userId],
            admins: [userId]
        });

        await newGroup.save();
        await newGroup.populate("members", "name email");
        await newGroup.populate("admins", "name email");

        res.status(201).json({ success: true, data: newGroup, message: "Group created successfully" });
    } catch (error) {
        console.error("Error creating group:", error);
        res.status(500).json({ success: false, message: "Server error creating group" });
    }
};

export const getUserGroups = async (req, res) => {
    try {
        const userId = req.user._id;
        
        const groups = await Group.find({ members: userId })
            .populate("members", "name email")
            .populate("admins", "name email");
            
        res.status(200).json({ success: true, data: groups });
    } catch (error) {
        console.error("Error fetching groups:", error);
        res.status(500).json({ success: false, message: "Server error fetching groups" });
    }
};

export const getGroupDetails = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId)
            .populate("members", "name email")
            .populate("admins", "name email");

        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        // Ensure the requesting user is a member
        const isMember = group.members.some(m => m._id.toString() === userId.toString());
        if (!isMember) {
            return res.status(403).json({ success: false, message: "You are not a member of this group" });
        }

        res.status(200).json({ success: true, data: group });
    } catch (error) {
        console.error("Error fetching group details:", error);
        res.status(500).json({ success: false, message: "Server error fetching group details" });
    }
};

export const addMember = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { targetUserId } = req.body;
        const requesterId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        // Must be an admin to add members
        if (!isGroupAdmin(group, requesterId)) {
            return res.status(403).json({ success: false, message: "Only admins can add members" });
        }

        // Check if user exists
        const userToAdd = await User.findById(targetUserId);
        if (!userToAdd) return res.status(404).json({ success: false, message: "User not found" });

        // Check if already a member
        if (group.members.includes(targetUserId)) {
            return res.status(400).json({ success: false, message: "User is already a member" });
        }

        group.members.push(targetUserId);
        await group.save();

        res.status(200).json({ success: true, message: "Member added successfully" });
    } catch (error) {
        console.error("Error adding member:", error);
        res.status(500).json({ success: false, message: "Server error adding member" });
    }
};

export const removeMember = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const requesterId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        // A user can leave, or an admin can remove them
        const isSelfLeave = requesterId.toString() === userId.toString();
        if (!isSelfLeave && !isGroupAdmin(group, requesterId)) {
            return res.status(403).json({ success: false, message: "Only admins can remove other members" });
        }

        // Creator cannot be removed or leave unless they are the last member
        if (group.creatorId.toString() === userId.toString() && group.members.length > 1) {
            return res.status(400).json({ success: false, message: "Group creator cannot leave while others are in the group" });
        }

        group.members = group.members.filter(id => id.toString() !== userId.toString());
        group.admins = group.admins.filter(id => id.toString() !== userId.toString());
        
        await group.save();

        res.status(200).json({ success: true, message: isSelfLeave ? "Left group successfully" : "Member removed successfully" });
    } catch (error) {
        console.error("Error removing member:", error);
        res.status(500).json({ success: false, message: "Server error removing member" });
    }
};

export const promoteAdmin = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { targetUserId } = req.body;
        const requesterId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        // Must be an admin to promote others
        if (!isGroupAdmin(group, requesterId)) {
            return res.status(403).json({ success: false, message: "Only admins can promote members" });
        }

        // User must be a member
        if (!group.members.includes(targetUserId)) {
            return res.status(400).json({ success: false, message: "User is not a member of this group" });
        }

        // Already admin?
        if (group.admins.includes(targetUserId)) {
            return res.status(400).json({ success: false, message: "User is already an admin" });
        }

        group.admins.push(targetUserId);
        await group.save();

        res.status(200).json({ success: true, message: "User promoted to admin successfully" });
    } catch (error) {
        console.error("Error promoting admin:", error);
        res.status(500).json({ success: false, message: "Server error promoting admin" });
    }
};

export const demoteAdmin = async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        const requesterId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found" });

        // Must be an admin to demote others
        if (!isGroupAdmin(group, requesterId)) {
            return res.status(403).json({ success: false, message: "Only admins can demote members" });
        }

        // Creator cannot be demoted
        if (group.creatorId.toString() === userId.toString()) {
            return res.status(400).json({ success: false, message: "Group creator cannot be demoted" });
        }

        group.admins = group.admins.filter(id => id.toString() !== userId.toString());
        await group.save();

        res.status(200).json({ success: true, message: "User demoted successfully" });
    } catch (error) {
        console.error("Error demoting admin:", error);
        res.status(500).json({ success: false, message: "Server error demoting admin" });
    }
};

export const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;
        const userId = req.user._id;

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ success: false, message: "Group not found or invalid code" });

        if (group.members.includes(userId)) {
            return res.status(400).json({ success: false, message: "You are already a member of this team" });
        }

        group.members.push(userId);
        await group.save();
        await group.populate("members", "name email");
        await group.populate("admins", "name email");

        res.status(200).json({ success: true, message: "Successfully joined the team", data: group });
    } catch (error) {
        console.error("Error joining group:", error);
        res.status(500).json({ success: false, message: "Server error joining group" });
    }
};
