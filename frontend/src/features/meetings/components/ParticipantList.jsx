import React from 'react';

/**
 * ParticipantList.jsx
 */
export function ParticipantList({ participants }) {
    return (
        <div className="bg-gray-900 border-l border-gray-800 w-80 h-full fixed right-0 top-0 p-4 text-white overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Participants ({participants.size + 1})</h2>
            <ul>
                <li className="py-2 border-b border-gray-800">
                    <span className="font-semibold">You</span>
                </li>
                {Array.from(participants.values()).map(p => (
                    <li key={p.id} className="py-2 border-b border-gray-800 flex justify-between items-center">
                        <span>{p.name}</span>
                        <div className="flex gap-2">
                            {/* In a real app we'd determine state from the track enabled status */}
                            <span title="Audio">🎤</span>
                            <span title="Video">📷</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
