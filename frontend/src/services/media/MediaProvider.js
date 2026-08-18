/**
 * MediaProvider.js
 * 
 * The core abstraction that decouples React components from specific
 * WebRTC or SFU implementations.
 * 
 * In Stage 1-3, this is implemented by WebRTCMeshAdapter (for dev/testing).
 * In Stage 3+, this is implemented by LiveKitAdapter (for production).
 */
export class MediaProvider {
    /**
     * Connect to the signalling server / SFU.
     * @param {Object} config - Connection config
     */
    async connect(config) { throw new Error("Not implemented"); }
    
    /**
     * Disconnect and clean up all media resources.
     */
    async disconnect() { throw new Error("Not implemented"); }

    /**
     * Join a specific meeting room.
     */
    async joinMeeting(meetingId) { throw new Error("Not implemented"); }
    async leaveMeeting() { throw new Error("Not implemented"); }

    // ── Local Media Controls ──────────────────────────────────────────────────
    async enableMicrophone() { throw new Error("Not implemented"); }
    async disableMicrophone() { throw new Error("Not implemented"); }
    
    async enableCamera(constraints) { throw new Error("Not implemented"); }
    async disableCamera() { throw new Error("Not implemented"); }
    
    async startScreenShare() { throw new Error("Not implemented"); }
    async stopScreenShare() { throw new Error("Not implemented"); }

    // ── State Getters ─────────────────────────────────────────────────────────
    getLocalTracks() { throw new Error("Not implemented"); }
    getRemoteParticipants() { throw new Error("Not implemented"); }

    // ── Selective Subscription (For Large Meetings - Stage 4+) ───────────────
    async subscribeToParticipant(participantId) { throw new Error("Not implemented"); }
    async unsubscribeFromParticipant(participantId) { throw new Error("Not implemented"); }
    async setVideoQuality(participantId, quality) { throw new Error("Not implemented"); }
    async setSubscriptionPriority(participantId, priority) { throw new Error("Not implemented"); }

    // ── Events ───────────────────────────────────────────────────────────────
    /**
     * Subscribe to events: 'participant-joined', 'participant-left', 
     * 'active-speaker', 'track-added', 'track-removed'
     */
    on(event, handler) { throw new Error("Not implemented"); }
    off(event, handler) { throw new Error("Not implemented"); }
}
