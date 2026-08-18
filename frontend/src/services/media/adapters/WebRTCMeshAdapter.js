/**
 * WebRTCMeshAdapter.js
 * 
 * Development-only implementation of MediaProvider using full-mesh P2P WebRTC.
 * Extracted from video.jsx. 
 * Will be replaced by LiveKitAdapter in Stage 3 for production.
 */
import { MediaProvider } from "../MediaProvider.js";

const peerConnectionConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" }
    ]
};

export class WebRTCMeshAdapter extends MediaProvider {
    constructor() {
        super();
        this.listeners = new Map();
        this.connections = new Map(); // socketId -> RTCPeerConnection
        this.remoteStreams = new Map(); // socketId -> MediaStream
        this.localStream = null;
        this.socket = null; // Injected via config during connect()
    }

    // ── Internal Event Emitter ───────────────────────────────────────────────
    on(event, handler) {
        if (!this.listeners.has(event)) this.listeners.set(event, new Set());
        this.listeners.get(event).add(handler);
    }
    
    off(event, handler) {
        this.listeners.get(event)?.delete(handler);
    }

    emit(event, ...args) {
        this.listeners.get(event)?.forEach(handler => handler(...args));
    }

    // ── MediaProvider Implementation ─────────────────────────────────────────

    async connect(config) {
        this.socket = config.socket;
        
        // Remove existing listeners to prevent duplicates during StrictMode
        this.socket.off("media:offer");
        this.socket.off("media:answer");
        this.socket.off("media:ice-candidate");
        this.socket.off("meeting:participant-joined");
        this.socket.off("meeting:participant-left");
        
        // Setup socket listeners for signalling
        this.socket.on("media:offer", async ({ fromId, sdp }) => {
            if (!this.connections.has(fromId)) this._createPeerConnection(fromId);
            const pc = this.connections.get(fromId);
            await pc.setRemoteDescription(new RTCSessionDescription(sdp));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            this.socket.emit("media:answer", { targetId: fromId, sdp: answer });
        });

        this.socket.on("media:answer", async ({ fromId, sdp }) => {
            const pc = this.connections.get(fromId);
            if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
        });

        this.socket.on("media:ice-candidate", async ({ fromId, candidate }) => {
            const pc = this.connections.get(fromId);
            if (pc) await pc.addIceCandidate(new RTCIceCandidate(candidate));
        });

        this.socket.on("meeting:participant-joined", async ({ socketId }) => {
            // Initiate connection when someone joins
            const pc = this._createPeerConnection(socketId);
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            this.socket.emit("media:offer", { targetId: socketId, sdp: offer });
        });

        this.socket.on("meeting:participant-left", ({ socketId }) => {
            this._removePeerConnection(socketId);
        });
    }

    async disconnect() {
        this.connections.forEach((pc, id) => this._removePeerConnection(id));
        if (this.localStream) {
            this.localStream.getTracks().forEach(t => t.stop());
            this.localStream = null;
        }
    }

    async joinMeeting(meetingId) {
        // Signalling is handled by the socket manager component.
        // We just ensure local media is ready.
        if (!this.localStream) {
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            } catch (err) {
                console.error("Failed to get local media", err);
                this.localStream = new MediaStream(); // empty
            }
        }
    }

    async leaveMeeting() {
        await this.disconnect();
    }

    // ── Media Controls ───────────────────────────────────────────────────────
    
    async enableMicrophone() {
        this._setTrackEnabled("audio", true);
    }
    
    async disableMicrophone() {
        this._setTrackEnabled("audio", false);
    }

    async enableCamera() {
        this._setTrackEnabled("video", true);
    }
    
    async disableCamera() {
        this._setTrackEnabled("video", false);
    }

    _setTrackEnabled(kind, enabled) {
        if (!this.localStream) return;
        const tracks = kind === "audio" ? this.localStream.getAudioTracks() : this.localStream.getVideoTracks();
        tracks.forEach(t => t.enabled = enabled);
    }

    async startScreenShare() {
        try {
            const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
            const screenTrack = stream.getVideoTracks()[0];
            
            this.connections.forEach(pc => {
                const sender = pc.getSenders().find(s => s.track?.kind === 'video');
                if (sender) sender.replaceTrack(screenTrack);
            });

            screenTrack.onended = () => this.stopScreenShare();
        } catch (err) {
            console.error("Failed to share screen", err);
        }
    }

    async stopScreenShare() {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (!videoTrack) return;
        
        this.connections.forEach(pc => {
            const sender = pc.getSenders().find(s => s.track?.kind === 'video');
            if (sender) sender.replaceTrack(videoTrack);
        });
    }

    // ── Getters ──────────────────────────────────────────────────────────────
    
    getLocalTracks() {
        if (!this.localStream) return [];
        return this.localStream.getTracks().map(track => ({
            id: track.id,
            kind: track.kind,
            track,
            isMuted: !track.enabled
        }));
    }

    getRemoteParticipants() {
        const participants = new Map();
        this.remoteStreams.forEach((stream, id) => {
            participants.set(id, {
                id,
                name: `User ${id.substring(0,4)}`,
                tracks: stream.getTracks().map(track => ({
                    id: track.id,
                    kind: track.kind,
                    track,
                    isMuted: !track.enabled
                }))
            });
        });
        return participants;
    }

    // ── No-ops for Mesh (These are for SFU) ──────────────────────────────────
    async subscribeToParticipant(id) {}
    async unsubscribeFromParticipant(id) {}
    async setVideoQuality(id, quality) {}
    async setSubscriptionPriority(id, priority) {}

    // ── Internal Helpers ─────────────────────────────────────────────────────

    _createPeerConnection(targetId) {
        const pc = new RTCPeerConnection(peerConnectionConfig);
        
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                this.socket.emit("media:ice-candidate", { targetId, candidate: event.candidate });
            }
        };

        pc.ontrack = (event) => {
            if (!this.remoteStreams.has(targetId)) {
                this.remoteStreams.set(targetId, new MediaStream());
            }
            const stream = this.remoteStreams.get(targetId);
            stream.addTrack(event.track);
            
            // Notify UI
            const participant = this.getRemoteParticipants().get(targetId);
            this.emit("track-added", { id: event.track.id, kind: event.track.kind, track: event.track }, participant);
        };

        if (this.localStream) {
            this.localStream.getTracks().forEach(track => pc.addTrack(track, this.localStream));
        }

        this.connections.set(targetId, pc);
        return pc;
    }

    _removePeerConnection(targetId) {
        const pc = this.connections.get(targetId);
        if (pc) {
            pc.close();
            this.connections.delete(targetId);
        }
        this.remoteStreams.delete(targetId);
        this.emit("participant-left", targetId);
    }
}
