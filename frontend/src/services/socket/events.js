/**
 * events.js
 * 
 * Centralized constant definitions for Socket.IO events.
 */
export const SocketEvents = {
    // Connection
    CONNECT: "connect",
    DISCONNECT: "disconnect",
    CONNECT_ERROR: "connect_error",

    // Signalling (Stage 1/2 WebRTC P2P)
    MEDIA_OFFER: "media:offer",
    MEDIA_ANSWER: "media:answer",
    MEDIA_ICE_CANDIDATE: "media:ice-candidate",

    // Meeting Lifecycle
    MEETING_JOIN: "meeting:join",
    MEETING_LEAVE: "meeting:leave",
    PARTICIPANT_JOINED: "meeting:participant-joined",
    PARTICIPANT_LEFT: "meeting:participant-left",
    PARTICIPANT_STATE_CHANGED: "participant:state-changed",

    // Controls
    PARTICIPANT_MUTE: "participant:mute",
    PARTICIPANT_UNMUTE: "participant:unmute",
    PARTICIPANT_CAMERA_ON: "participant:camera-on",
    PARTICIPANT_CAMERA_OFF: "participant:camera-off",
    HAND_RAISE: "hand:raise",
    HAND_LOWER: "hand:lower",
    SCREEN_START: "screen:start",
    SCREEN_STOP: "screen:stop",

    // Chat
    CHAT_JOIN: "chat:join",
    CHAT_MESSAGE: "chat:message",
    CHAT_TYPING: "chat:typing",

    // Presence
    PRESENCE_ONLINE: "presence:online",
    PRESENCE_OFFLINE: "presence:offline",
};
