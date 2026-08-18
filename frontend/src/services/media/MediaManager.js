/**
 * MediaManager.js
 * 
 * Factory that instantiates and provides access to the correct MediaProvider.
 */
import { WebRTCMeshAdapter } from "./adapters/WebRTCMeshAdapter.js";
import { LiveKitAdapter } from "./adapters/LiveKitAdapter.js";

class MediaManager {
    constructor() {
        this.provider = null;
    }

    /**
     * Initialize the appropriate adapter based on environment/config.
     */
    init(type = "mesh") {
        if (this.provider) return this.provider;

        // In Stage 1, we default to the legacy mesh adapter for backward compatibility.
        // In Stage 3, this will switch to LiveKitAdapter for production.
        if (type === "livekit") {
            this.provider = new LiveKitAdapter();
        } else {
            console.warn("[MediaManager] Using WebRTCMeshAdapter (Development only)");
            this.provider = new WebRTCMeshAdapter();
        }

        return this.provider;
    }

    getProvider() {
        if (!this.provider) {
            throw new Error("MediaManager not initialized. Call init() first.");
        }
        return this.provider;
    }
}

export const mediaManager = new MediaManager();
