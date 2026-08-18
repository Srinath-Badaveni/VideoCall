/**
 * meeting.service.js
 */
import { v4 as uuidv4 } from "uuid";
import { AccessToken } from "livekit-server-sdk";
import config from "../config/env.js";
import * as meetingRepository from "../repositories/meeting.repository.js";
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
