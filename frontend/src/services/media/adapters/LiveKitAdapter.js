/**
 * LiveKitAdapter.js (Stage 1 Stub)
 * 
 * Production SFU adapter for Stage 3+. 
 * This file exists now to validate the MediaProvider abstraction.
 */
import { MediaProvider } from "../MediaProvider.js";

export class LiveKitAdapter extends MediaProvider {
    constructor() {
        super();
        this.listeners = new Map();
        console.log("[LiveKitAdapter] Initialized stub");
    }

    async connect(config) {
        console.log("[LiveKitAdapter] connect", config);
    }
    
    async disconnect() {
        console.log("[LiveKitAdapter] disconnect");
    }

    async joinMeeting(meetingId) {
        console.log("[LiveKitAdapter] joinMeeting", meetingId);
    }

    async leaveMeeting() {
        console.log("[LiveKitAdapter] leaveMeeting");
    }

    async enableMicrophone() { console.log("[LiveKitAdapter] enableMicrophone"); }
    async disableMicrophone() { console.log("[LiveKitAdapter] disableMicrophone"); }
    async enableCamera() { console.log("[LiveKitAdapter] enableCamera"); }
    async disableCamera() { console.log("[LiveKitAdapter] disableCamera"); }
    async startScreenShare() { console.log("[LiveKitAdapter] startScreenShare"); }
    async stopScreenShare() { console.log("[LiveKitAdapter] stopScreenShare"); }

    getLocalTracks() { return []; }
    getRemoteParticipants() { return new Map(); }

    async subscribeToParticipant(id) {}
    async unsubscribeFromParticipant(id) {}
    async setVideoQuality(id, quality) {}
    async setSubscriptionPriority(id, priority) {}

    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
    }
    
    off(event, handler) {
        this.listeners.get(event)?.delete(handler);
    }
}
