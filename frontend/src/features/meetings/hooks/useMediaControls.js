/**
 * useMediaControls.js
 * 
 * Hook to manage local media controls (mute, camera, screen share).
 */
import { useState, useCallback } from "react";
import { mediaManager } from "../../../services/media/MediaManager.js";
import { socketManager } from "../../../services/socket/SocketManager.js";
import { SocketEvents } from "../../../services/socket/events.js";

export function useMediaControls() {
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const [screenSharing, setScreenSharing] = useState(false);

    const toggleAudio = useCallback(async () => {
        const provider = mediaManager.getProvider();
        if (audioEnabled) {
            await provider.disableMicrophone();
            socketManager.getSocket()?.emit(SocketEvents.PARTICIPANT_MUTE);
        } else {
            await provider.enableMicrophone();
            socketManager.getSocket()?.emit(SocketEvents.PARTICIPANT_UNMUTE);
        }
        setAudioEnabled(!audioEnabled);
    }, [audioEnabled]);

    const toggleVideo = useCallback(async () => {
        const provider = mediaManager.getProvider();
        if (videoEnabled) {
            await provider.disableCamera();
            socketManager.getSocket()?.emit(SocketEvents.PARTICIPANT_CAMERA_OFF);
        } else {
            await provider.enableCamera();
            socketManager.getSocket()?.emit(SocketEvents.PARTICIPANT_CAMERA_ON);
        }
        setVideoEnabled(!videoEnabled);
    }, [videoEnabled]);

    const toggleScreenShare = useCallback(async () => {
        const provider = mediaManager.getProvider();
        if (screenSharing) {
            await provider.stopScreenShare();
            socketManager.getSocket()?.emit(SocketEvents.SCREEN_STOP);
        } else {
            await provider.startScreenShare();
            socketManager.getSocket()?.emit(SocketEvents.SCREEN_START);
        }
        setScreenSharing(!screenSharing);
    }, [screenSharing]);

    return {
        audioEnabled,
        videoEnabled,
        screenSharing,
        toggleAudio,
        toggleVideo,
        toggleScreenShare
    };
}
