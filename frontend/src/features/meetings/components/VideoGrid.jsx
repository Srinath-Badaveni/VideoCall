import React, { useRef, useEffect } from 'react';

function VideoPlayer({ tracks, name, isLocal }) {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && tracks) {
            const stream = new MediaStream();
            tracks.forEach(t => stream.addTrack(t.track));
            videoRef.current.srcObject = stream;
        }
    }, [tracks]);

    return (
        <div className="relative bg-gray-800 rounded-lg overflow-hidden aspect-video">
            <video 
                ref={videoRef}
                autoPlay 
                playsInline 
                muted={isLocal} 
                className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`}
            />
            <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-sm">
                {name || "User"} {isLocal && "(You)"}
            </div>
        </div>
    );
}

export function VideoGrid({ localTracks, participants }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 w-full max-h-screen overflow-y-auto pb-24">
            {/* Local Video */}
            {localTracks && localTracks.length > 0 && (
                <VideoPlayer tracks={localTracks} isLocal={true} />
            )}
            
            {/* Remote Videos */}
            {Array.from(participants.values()).map(participant => (
                <VideoPlayer 
                    key={participant.id} 
                    tracks={participant.tracks} 
                    name={participant.name} 
                    isLocal={false} 
                />
            ))}
        </div>
    );
}
