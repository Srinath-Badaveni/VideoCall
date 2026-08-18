import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useMeeting } from "../features/meetings/hooks/useMeeting";
import { useMediaControls } from "../features/meetings/hooks/useMediaControls";
import { VideoGrid } from "../features/meetings/components/VideoGrid";
import { ControlBar } from "../features/meetings/components/ControlBar";
import { ParticipantList } from "../features/meetings/components/ParticipantList";

import { MeetingChat } from "../features/meetings/components/MeetingChat";

export default function VideoMeet() {
    const { url: meetingCode } = useParams();
    const { user, token } = useAuth();
    const navigate = useNavigate();

    const [hasJoined, setHasJoined] = useState(false);
    const [activeTab, setActiveTab] = useState("chat");
    
    // Extracted Meeting Hooks
    const { participants, localTracks, isConnected, error } = useMeeting(hasJoined ? meetingCode : null, token);
    const { 
        audioEnabled, videoEnabled, screenSharing, 
        toggleAudio, toggleVideo, toggleScreenShare 
    } = useMediaControls();

    const handleJoin = () => {
        if (!user) {
            navigate("/login");
            return;
        }
        setHasJoined(true);
    };

    const handleLeave = () => {
        setHasJoined(false);
        navigate("/dashboard");
    };

    if (!hasJoined) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
                <div className="bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center">
                    <h2 className="text-3xl text-white font-bold mb-6">Join Meeting</h2>
                    <p className="text-gray-400 mb-8">Meeting Code: {meetingCode || "N/A"}</p>
                    <button 
                        onClick={handleJoin}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition"
                    >
                        Join Now
                    </button>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-6 text-white">
                <h2 className="text-2xl text-red-500 font-bold mb-4">Error joining meeting</h2>
                <p className="mb-6">{error}</p>
                <button onClick={handleLeave} className="px-6 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex overflow-hidden">
            <div className="flex-1 flex flex-col relative mr-80">
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
                    <div>
                        <div className="bg-black/50 text-white px-4 py-2 rounded-lg backdrop-blur text-sm font-medium">
                            Meeting: {meetingCode}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {!isConnected && (
                            <span className="bg-yellow-500/80 text-white px-3 py-1 rounded text-sm">Connecting...</span>
                        )}
                    </div>
                </div>

                {/* Video Grid */}
                <VideoGrid localTracks={localTracks} participants={participants} />

                {/* Controls */}
                <ControlBar 
                    audioEnabled={audioEnabled} toggleAudio={toggleAudio}
                    videoEnabled={videoEnabled} toggleVideo={toggleVideo}
                    screenSharing={screenSharing} toggleScreenShare={toggleScreenShare}
                    onLeave={handleLeave}
                />
            </div>
            
            {/* Sidebar (Chat / Participants) */}
            <div className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900 border-l border-gray-800 flex flex-col z-20">
                <div className="flex bg-gray-800 border-b border-gray-700">
                    <button 
                        className={`flex-1 py-3 text-sm font-bold ${activeTab === 'chat' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('chat')}
                    >
                        Chat
                    </button>
                    <button 
                        className={`flex-1 py-3 text-sm font-bold ${activeTab === 'participants' ? 'text-white border-b-2 border-blue-500' : 'text-gray-400'}`}
                        onClick={() => setActiveTab('participants')}
                    >
                        Participants ({participants.size + 1})
                    </button>
                </div>
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === 'chat' ? (
                        <div className="absolute inset-0">
                            <MeetingChat meetingCode={meetingCode} />
                        </div>
                    ) : (
                        <div className="absolute inset-0">
                            <ParticipantList participants={participants} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
