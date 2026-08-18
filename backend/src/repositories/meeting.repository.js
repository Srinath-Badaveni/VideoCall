/**
 * meeting.repository.js (Stage 1 Stub)
 */
import Meeting from "../models/meeting.model.js";

export async function findByCode(meetingCode) {
    return Meeting.findOne({ meetingCode }).populate("hostId", "name email");
}

export async function create(meetingData) {
    const meeting = new Meeting(meetingData);
    return meeting.save();
}

export async function updateStatus(meetingCode, status) {
    return Meeting.findOneAndUpdate({ meetingCode }, { status }, { new: true });
}
