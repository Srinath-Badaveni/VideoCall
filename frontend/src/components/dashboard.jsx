import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext'; // Import the useAuth hook

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth(); // Get user and logout function from the AuthContext
    const [showJoinField, setShowJoinField] = useState(false);
    const [meetId, setMeetId] = useState('');

    // The useEffect hook for checking localStorage is no longer needed
    // as this logic is handled by the AuthProvider and ProtectedRoute.

    const handleCreateMeet = () => {
        const newMeetId = uuidv4();
        // No need to pass username in state; VideoMeet will get it from the context
        navigate(`/meet/${newMeetId}`);
    };

    const handleJoinMeet = () => {
        if (meetId.trim()) {
            // No need to pass username in state here either
            navigate(`/meet/${meetId}`);
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    // The manual handleLogout function is also no longer needed.
    // We can call the `logout` function from the context directly.

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
            {/* Header */}
            <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold">VideoCaller Pro</h1>
                    <button
                        onClick={logout} // Use the logout function from the context
                        className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg font-semibold transition"
                    >
                        Logout
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="mb-8">
                    {/* The user object now comes reliably from the AuthContext */}
                    <h2 className="text-4xl font-bold mb-2">Welcome, {user?.name || user?.email}! 👋</h2>
                    <p className="text-gray-400">Start or join a video meeting anytime.</p>
                </div>

                {/* Meeting Actions */}
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-12 flex flex-col md:flex-row items-center gap-6">
                    <div className="flex-1">
                        <h3 className="text-2xl font-bold mb-2">New Meeting</h3>
                        <p className="text-gray-400">Create a new meeting and invite others to join.</p>
                    </div>
                    <button
                        onClick={handleCreateMeet}
                        className="bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold transition text-lg"
                    >
                        Create Meet
                    </button>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-lg p-8 mb-12">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className="flex-1">
                            <h3 className="text-2xl font-bold mb-2">Join a Meeting</h3>
                            <p className="text-gray-400">Enter a meeting ID to join an existing call.</p>
                        </div>
                        <button
                            onClick={() => setShowJoinField(!showJoinField)}
                            className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold transition text-lg"
                        >
                            Join Meet
                        </button>
                    </div>
                    {showJoinField && (
                        <div className="mt-6 flex gap-4">
                            <input
                                type="text"
                                value={meetId}
                                onChange={(e) => setMeetId(e.target.value)}
                                placeholder="Enter Meeting ID"
                                className="flex-grow bg-gray-800 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <button
                                onClick={handleJoinMeet}
                                className="bg-green-600 hover:bg-green-700 px-8 py-3 rounded-lg font-semibold transition"
                            >
                                Join
                            </button>
                        </div>
                    )}
                </div>

                {/* Placeholder for Stats and Recent Calls sections */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Your stats cards would go here */}
                </div>
                <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
                    {/* Your recent calls list would go here */}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
