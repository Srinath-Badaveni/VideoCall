import React from 'react';

/**
 * ControlBar.jsx
 */
export function ControlBar({ 
    audioEnabled, toggleAudio, 
    videoEnabled, toggleVideo, 
    screenSharing, toggleScreenShare,
    onLeave 
}) {
    return (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-900 flex justify-center gap-4 border-t border-gray-800">
            <button 
                onClick={toggleAudio}
                className={`p-4 rounded-full ${audioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white transition`}
            >
                {audioEnabled ? '🎤 Mute' : '🔇 Unmute'}
            </button>
            <button 
                onClick={toggleVideo}
                className={`p-4 rounded-full ${videoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'} text-white transition`}
            >
                {videoEnabled ? '📷 Stop Video' : '📸 Start Video'}
            </button>
            <button 
                onClick={toggleScreenShare}
                className={`p-4 rounded-full ${screenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition`}
            >
                🖥️ Share
            </button>
            <button 
                onClick={onLeave}
                className="p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition font-bold px-8"
            >
                Leave
            </button>
        </div>
    );
}
