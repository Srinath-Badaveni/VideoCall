/**
 * meeting.service.js
 */
import { v4 as uuidv4 } from "uuid";
import Meeting from "../models/meeting.model.js";
import { NotFoundError, ForbiddenError } from "../utils/errors.js";

export async function createMeeting(hostId, { title, scheduledAt, maxParticipants, waitingRoomEnabled }) {
    const meetingCode = uuidv4();
    
    const meeting = new Meeting({
        meetingCode,
        hostId,
        title: title || "New Meeting",
        scheduledAt,
        maxParticipants: maxParticipants || 100,
        waitingRoomEnabled: waitingRoomEnabled || false
    });
    
    await meeting.save();
    return meeting;
}

export async function getMeetingByCode(meetingCode) {
    const meeting = await Meeting.findOne({ meetingCode }).populate("hostId", "name email");
    if (!meeting) {
        throw new NotFoundError("Meeting not found");
    }
    return meeting;
}
