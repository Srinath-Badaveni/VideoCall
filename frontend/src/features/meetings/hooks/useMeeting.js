/**
 * useMeeting.js
 * 
 * Hook to manage meeting state using MediaProvider.
 */
import { useState, useEffect } from "react";
import { mediaManager } from "../../../services/media/MediaManager.js";
import { socketManager } from "../../../services/socket/SocketManager.js";

export function useMeeting(meetingCode, token) {
    const [participants, setParticipants] = useState(new Map());
    const [localTracks, setLocalTracks] = useState([]);
    const [error, setError] = useState(null);
    const [isConnected, setIsConnected] = useState(false);

    useEffect(() => {
        if (!meetingCode || !token) return;

        const provider = mediaManager.init("mesh");
        const socket = socketManager.connect(token);

        if (!socket) {
            setError("Socket not connected");
            return;
        }

        const handleTrackAdded = (trackInfo, participantInfo) => {
            setParticipants(prev => {
                const map = new Map(prev);
                const p = map.get(participantInfo.id) || { ...participantInfo, tracks: [] };
                // avoid duplicate tracks
                if (!p.tracks.find(t => t.id === trackInfo.id)) {
                    p.tracks.push(trackInfo);
                }
                map.set(participantInfo.id, p);
                return map;
            });
        };

        const handleParticipantLeft = (id) => {
            setParticipants(prev => {
                const map = new Map(prev);
                map.delete(id);
                return map;
            });
        };

        provider.on("track-added", handleTrackAdded);
        provider.on("participant-left", handleParticipantLeft);

        const init = async () => {
            try {
                await provider.connect({ socket });
                await provider.joinMeeting(meetingCode);
                setLocalTracks(provider.getLocalTracks());
                socket.emit("meeting:join", { meetingCode });
                setIsConnected(true);
            } catch (err) {
                setError(err.message);
            }
        };

        init();

        return () => {
            provider.off("track-added", handleTrackAdded);
            provider.off("participant-left", handleParticipantLeft);
            if (socket) {
                socket.emit("meeting:leave", { meetingCode });
            }
            provider.leaveMeeting();
            setIsConnected(false);
        };
    }, [meetingCode]);

    return {
        participants,
        localTracks,
        isConnected,
        error
    };
}
