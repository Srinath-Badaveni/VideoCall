import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from "@livekit/components-react";
import "@livekit/components-styles";

export default function VideoMeet() {
    const { url: meetingCode } = useParams();
    const { user, token: authToken } = useAuth();
    const navigate = useNavigate();

    const [hasJoined, setHasJoined] = useState(false);
    const [liveKitToken, setLiveKitToken] = useState("");
    const [activeTab, setActiveTab] = useState("chat");
    const [error, setError] = useState("");

    const LIVEKIT_URL = "wss://video-conf-mgv7ly4n.livekit.cloud";

    useEffect(() => {
        if (!hasJoined) return;

        const fetchToken = async () => {
            try {
                const res = await fetch(`http://localhost:8080/api/v1/meetings/${meetingCode}/token`, {
                    headers: { Authorization: `Bearer ${authToken}` }
                });
                if (res.status === 404) {
                    setError("Meeting not found. Please check the meeting code.");
                    return;
                }
                const data = await res.json();
                if (data.success) {
                    setLiveKitToken(data.data.token);
                } else {
                    setError(data.message || "Failed to fetch token");
                }
            } catch (err) {
                setError("Network error while joining meeting.");
                console.error("Failed to fetch token", err);
            }
        };

        fetchToken();
    }, [hasJoined, meetingCode, authToken]);

    const handleJoin = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        setHasJoined(true);
    };

    const handleLeave = () => {
        setHasJoined(false);
        setLiveKitToken("");
        navigate("/dashboard");
    };

    if (!hasJoined) {
        return (
            <div className="min-h-screen bg-gray-950 flex items-center justify-center p-6 font-sans">
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl backdrop-blur-xl">
                    <h2 className="text-4xl text-white font-extrabold mb-4 tracking-tight">Join Meeting</h2>
                    <p className="text-gray-400 mb-10 text-lg">Meeting Code: <span className="text-white font-mono">{meetingCode}</span></p>
                    <button 
                        onClick={handleJoin}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/30"
                    >
                        Join Now
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 font-sans">
                <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-8 max-w-md w-full text-center">
                    <h2 className="text-2xl text-red-400 font-bold mb-2">Failed to Join</h2>
                    <p className="text-gray-300 mb-6">{error}</p>
                    <button 
                        onClick={() => navigate("/dashboard")}
                        className="bg-gray-800 hover:bg-gray-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    if (!liveKitToken) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-white font-sans">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <h2 className="text-2xl font-bold text-gray-300 tracking-tight">Connecting to secure server...</h2>
            </div>
        );
    }

    return (
        <div className="h-screen w-screen bg-black flex overflow-hidden font-sans" data-lk-theme="default">
            {/* LiveKit Media Engine */}
            <div className="flex-1 h-full relative">
                <LiveKitRoom
                    video={true}
                    audio={true}
                    token={liveKitToken}
                    serverUrl={LIVEKIT_URL}
                    onDisconnected={handleLeave}
                    style={{ height: '100%', width: '100%' }}
                >
                    <VideoConference />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </div>
        </div>
    );
}
