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

export const getToken = async (req, res) => {
    const { code } = req.params;
    const token = await meetingService.generateLiveKitToken(code, req.user);
    
    res.status(200).json({
        success: true,
        data: { token }
    });
};

export const join = async (req, res) => {
    const { code } = req.params;
    await meetingService.joinMeeting(code, req.user._id);
    res.status(200).json({
        success: true,
        message: "Joined meeting successfully"
    });
};

export const leave = async (req, res) => {
    const { code } = req.params;
    await meetingService.leaveMeeting(code, req.user._id);
    res.status(200).json({
        success: true,
        message: "Left meeting successfully"
    });
};

export const getHistory = async (req, res) => {
    const history = await meetingService.getCallHistory(req.user._id);
    res.status(200).json({
        success: true,
        data: history
    });
};

export const getUpcomingMeetings = async (req, res) => {
    const upcoming = await meetingService.getUpcomingMeetings(req.user._id);
    res.status(200).json({
        success: true,
        data: upcoming
    });
};
