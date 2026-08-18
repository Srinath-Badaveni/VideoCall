/**
 * meeting.controller.js
 */
import * as meetingService from "../services/meeting.service.js";

export const create = async (req, res) => {
    const hostId = req.user._id;
    const meeting = await meetingService.createMeeting(hostId, req.body);
    
    res.status(201).json({
        success: true,
        data: meeting,
        message: "Meeting created"
    });
};

export const getByCode = async (req, res) => {
    const { code } = req.params;
    const meeting = await meetingService.getMeetingByCode(code);
    
    res.status(200).json({
        success: true,
        data: meeting
    });
};

export const join = async (req, res) => {
    // In Stage 2, this will create a MeetingParticipant and MeetingSession record
    res.status(200).json({
        success: true,
        message: "Joined meeting successfully"
    });
};

export const leave = async (req, res) => {
    // In Stage 2, this will update MeetingParticipant and MeetingSession records
    res.status(200).json({
        success: true,
        message: "Left meeting successfully"
    });
};
