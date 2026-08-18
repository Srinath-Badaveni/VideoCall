import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { LiveKitRoom, VideoConference, useRoomContext, useParticipants, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";
import { useAuth } from "../contexts/AuthContext";
import { API_BASE, LIVEKIT_URL } from "../config/api";

const HostControls = ({ isHost }) => {
    const room = useRoomContext();
    const participants = useParticipants();

    if (!isHost) return null;

    const handleMuteAll = () => {
        participants.forEach(p => {
            if (p.identity !== room.localParticipant.identity) {
                // LiveKit SDK doesn't allow remote mute unless you have the 'canUpdateOwnMetadata' and 'canUpdateMetadata' grants,
                // and you use RPC or DataChannels to request them to mute, OR if you have admin permissions.
                // For a true Teams clone, this would use the LiveKit server-side API or track muting.
                // We'll log it for now as a mock for the UI constraint.
                console.log(`Requested mute for ${p.identity}`);
            }
        });
        alert("Mute all requested (Requires Server API integration for hard-mute)");
    };

    return (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-900/90 text-white px-4 py-2 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-4 z-50 border border-gray-700">
            <span className="text-xs font-bold uppercase tracking-wider text-violet-400 flex items-center gap-1">
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
                Host
            </span>
            <div className="w-px h-4 bg-gray-600"></div>
            <button onClick={handleMuteAll} className="text-sm font-semibold hover:text-red-400 transition">
                Mute All
            </button>
            <button onClick={() => alert("Meeting locked")} className="text-sm font-semibold hover:text-blue-400 transition">
                Lock Meeting
            </button>
        </div>
    );
};

export default function VideoMeet() {
    const { url: roomCode } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();
    
    const [livekitToken, setLivekitToken] = useState("");
    const [meeting, setMeeting] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!token) return;

        const joinMeeting = async () => {
            try {
                // 1. Fetch meeting metadata to determine host status
                const metaRes = await fetch(`${API_BASE}/meetings/${roomCode}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const metaData = await metaRes.json();
                if (!metaData.success) {
                    setError("Meeting not found");
                    setLoading(false);
                    return;
                }
                setMeeting(metaData.data);

                // 2. Fetch LiveKit Token
                const tokenRes = await fetch(`${API_BASE}/meetings/${roomCode}/token`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const tokenData = await tokenRes.json();
                if (tokenData.success) {
                    setLivekitToken(tokenData.data.token);
                } else {
                    setError("Failed to get meeting token");
                }
            } catch (err) {
                console.error(err);
                setError("Error joining meeting");
            } finally {
                setLoading(false);
            }
        };

        joinMeeting();
    }, [roomCode, token]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-violet-500 border-t-transparent"></div>
            </div>
        );
    }

    if (error || !livekitToken) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-950 text-white">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-red-500 mb-2">Failed to join</h2>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate('/dashboard')}
                        className="bg-violet-600 hover:bg-violet-700 px-6 py-2 rounded-lg font-bold transition"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    const isHost = meeting?.hostId === user?._id;

    return (
        <div className="w-full h-screen bg-gray-950 text-white relative">
            <LiveKitRoom
                video={true}
                audio={true}
                token={livekitToken}
                serverUrl={LIVEKIT_URL}
                data-lk-theme="default"
                style={{ height: '100dvh' }}
                onDisconnected={() => navigate('/dashboard')}
            >
                {/* Custom Host Controls Layer */}
                <HostControls isHost={isHost} />
                
                {/* LiveKit Pre-built Grid & Controls */}
                <VideoConference />
                
                {/* Audio Renderer for remote participants */}
                <RoomAudioRenderer />
            </LiveKitRoom>
        </div>
    );
}
