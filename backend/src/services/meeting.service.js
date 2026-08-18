/**
 * meeting.service.js
 */
import { v4 as uuidv4 } from "uuid";
import { AccessToken } from "livekit-server-sdk";
import config from "../config/env.js";
import * as meetingRepository from "../repositories/meeting.repository.js";
import MeetingParticipant from "../models/meetingParticipant.model.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

export async function createMeeting(hostId, { title, scheduledAt, maxParticipants, waitingRoomEnabled }) {
    const meetingCode = uuidv4();
    
    return meetingRepository.create({
        meetingCode,
        hostId,
        title: title || "New Meeting",
        scheduledAt,
        maxParticipants: maxParticipants || 100,
        waitingRoomEnabled: waitingRoomEnabled || false
    });
}

export async function getMeetingByCode(meetingCode) {
    const meeting = await meetingRepository.findByCode(meetingCode);
    if (!meeting) {
        throw new NotFoundError("Meeting not found");
    }
    return meeting;
}

export async function generateLiveKitToken(meetingCode, user) {
    // Verify meeting exists
    await getMeetingByCode(meetingCode);
    
    const at = new AccessToken(config.livekitApiKey, config.livekitApiSecret, {
        identity: user._id.toString(),
        name: user.name,
    });
    
    at.addGrant({
        roomJoin: true,
        room: meetingCode,
        canPublish: true,
        canSubscribe: true,
    });
    
    return await at.toJwt();
}

export async function joinMeeting(meetingCode, userId) {
    const meeting = await getMeetingByCode(meetingCode);
    
    let participant = await MeetingParticipant.findOne({ meetingId: meeting._id, userId });
    if (!participant) {
        participant = new MeetingParticipant({
            meetingId: meeting._id,
            userId,
            role: meeting.hostId.toString() === userId.toString() ? "HOST" : "PARTICIPANT",
            status: "JOINED"
        });
        await participant.save();
    } else {
        participant.status = "JOINED";
        participant.leftAt = null;
        await participant.save();
    }
}

export async function leaveMeeting(meetingCode, userId) {
    const meeting = await getMeetingByCode(meetingCode);
    const participant = await MeetingParticipant.findOne({ meetingId: meeting._id, userId });
    if (participant) {
        participant.status = "LEFT";
        participant.leftAt = new Date();
        await participant.save();
    }
}

export async function getCallHistory(userId) {
    const participants = await MeetingParticipant.find({ userId }).populate('meetingId').sort({ createdAt: -1 });
    
    // Format history
    return participants.map(p => {
        const meeting = p.meetingId;
        if (!meeting) return null;
        return {
            meetingCode: meeting.meetingCode,
            title: meeting.title,
            role: p.role,
            status: p.status,
            joinedAt: p.joinedAt,
            leftAt: p.leftAt,
            createdAt: meeting.createdAt,
            hostId: meeting.hostId
        };
    }).filter(Boolean);
}

export async function getUpcomingMeetings(userId) {
    return meetingRepository.findUpcomingByHostId(userId);
}
