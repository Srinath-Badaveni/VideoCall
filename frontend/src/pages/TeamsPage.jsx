import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { API_BASE } from '../config/api';
import ChatRoom from '../components/ChatRoom';

export default function TeamsPage() {
    const navigate = useNavigate();
    const { token, user, isAuthenticated } = useAuth();
    const { connect, joinRoom } = useChat();
    
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [newGroupDesc, setNewGroupDesc] = useState('');
    const [selectedGroup, setSelectedGroup] = useState(null);

    const [showJoinModal, setShowJoinModal] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [showAddMemberModal, setShowAddMemberModal] = useState(false);
    const [allUsers, setAllUsers] = useState([]);
    const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", { replace: true });
        } else {
            connect();
        }
    }, [isAuthenticated, navigate, connect]);

    useEffect(() => {
        fetchGroups();
    }, [token]);

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${API_BASE}/groups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) setGroups(data.data);
        } catch (error) {
            console.error('Error fetching groups:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectGroup = (group) => {
        setSelectedGroup(group);
        joinRoom(group._id, user.name);
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE}/groups`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
            });
            const data = await res.json();
            if (data.success) {
                setGroups([...groups, data.data]);
                setShowCreateModal(false);
                setNewGroupName('');
                setNewGroupDesc('');
                handleSelectGroup(data.data);
            }
        } catch (error) {
            console.error('Error creating group:', error);
        }
    };

    const handleJoinTeam = async (e) => {
        e.preventDefault();
        if (!joinCode) return;
        try {
            const res = await fetch(`${API_BASE}/groups/${joinCode}/join`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setGroups([...groups, data.data]);
                setShowJoinModal(false);
                setJoinCode('');
                handleSelectGroup(data.data);
            } else {
                alert(data.message || 'Error joining team');
            }
        } catch (error) {
            console.error('Error joining group:', error);
            alert('Failed to join team. Check code.');
        }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/users/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === 200) setAllUsers(data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    useEffect(() => {
        if (showAddMemberModal && allUsers.length === 0) fetchAllUsers();
    }, [showAddMemberModal]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!selectedUserToAdd || !selectedGroup) return;
        try {
            const res = await fetch(`${API_BASE}/groups/${selectedGroup._id}/members`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ targetUserId: selectedUserToAdd })
            });
            const data = await res.json();
            if (data.success) {
                alert('Member added successfully!');
                setShowAddMemberModal(false);
                setSelectedUserToAdd('');
                fetchGroups();
            } else {
                alert(data.message || 'Error adding member');
            }
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    return (
        <div className="flex w-full h-full bg-gray-950 overflow-hidden relative">
            {/* Left Panel: Teams List */}
            <div className="w-full md:w-72 lg:w-80 border-r border-gray-800 bg-gray-950 flex flex-col flex-shrink-0 transition-all hidden md:flex">
                <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950">
                    <h2 className="text-lg font-bold text-gray-100">Squads</h2>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowJoinModal(true)}
                            title="Join Team via Code"
                            className="text-gray-400 hover:text-white hover:bg-gray-800 p-1.5 rounded-md transition"
                        >
                            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>
                        </button>
                        <button 
                            onClick={() => setShowCreateModal(true)}
                            title="Create New Team"
                            className="text-gray-400 hover:text-white hover:bg-gray-800 p-1.5 rounded-md transition"
                        >
                            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                        </button>
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                    <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 px-1">Your Teams</p>
                    {loading ? (
                        <p className="text-center text-gray-500 mt-4 text-sm">Loading teams...</p>
                    ) : groups.length === 0 ? (
                        <div className="text-center p-6 text-gray-400">
                            <p className="text-sm">You haven't joined any teams yet.</p>
                            <button onClick={() => setShowCreateModal(true)} className="mt-3 text-violet-400 hover:text-violet-300 text-xs font-semibold">
                                Create your first team →
                            </button>
                        </div>
                    ) : (
                        groups.map(group => (
                            <div 
                                key={group._id} 
                                onClick={() => handleSelectGroup(group)}
                                className={`flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition ${
                                    selectedGroup?._id === group._id ? 'bg-gray-800 shadow-sm ring-1 ring-gray-700' : 'hover:bg-gray-800/50 text-gray-300 hover:text-gray-100'
                                }`}
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-[#5B5FC7] to-purple-500 text-white flex items-center justify-center rounded text-xs font-bold flex-shrink-0">
                                    {group.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="overflow-hidden">
                                    <h3 className={`text-sm truncate ${selectedGroup?._id === group._id ? 'font-bold' : 'font-medium'}`}>{group.name}</h3>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: ChatRoom */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {selectedGroup ? (
                    <ChatRoom 
                        isDmOnly={false} 
                        onAddMember={
                            selectedGroup.admins.some(a => (a._id || a) === user._id) 
                                ? () => setShowAddMemberModal(true) 
                                : null
                        } 
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-gray-900">
                        <div className="w-48 h-48 mb-6">
                            <svg viewBox="0 0 24 24" fill="none" stroke="#5B5FC7" strokeWidth="1" className="w-full h-full opacity-20"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-100 mb-2">Connect with your Teams</h2>
                        <p className="text-gray-400 max-w-md">Select a team from the left to view its channels and members, or create a new team to get started collaborating.</p>
                        <div className="mt-8 flex gap-4">
                            <button onClick={() => setShowJoinModal(true)} className="border border-[#5B5FC7] text-[#5B5FC7] hover:bg-gray-800 px-6 py-2.5 rounded-md font-semibold transition shadow-sm">
                                Join Team
                            </button>
                            <button onClick={() => setShowCreateModal(true)} className="bg-[#5B5FC7] hover:bg-[#464EB8] text-white px-6 py-2.5 rounded-md font-semibold transition shadow-sm">
                                Create New Team
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Create Team Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideIn">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-100">Create a Team</h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleCreateGroup} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Team Name</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        className="w-full border border-gray-600 bg-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7]"
                                        placeholder="e.g. Project Alpha"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Description (Optional)</label>
                                    <textarea 
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                        className="w-full border border-gray-600 bg-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7]"
                                        placeholder="What is this team about?"
                                        rows={3}
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition">Cancel</button>
                                <button type="submit" className="bg-[#5B5FC7] hover:bg-[#464EB8] text-white px-4 py-2 rounded-md font-semibold text-sm transition">Create Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Join Team Modal */}
            {showJoinModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideIn">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-100">Join a Team</h3>
                            <button onClick={() => setShowJoinModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleJoinTeam} className="p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-300 mb-1">Team Code</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={joinCode}
                                        onChange={(e) => setJoinCode(e.target.value)}
                                        className="w-full border border-gray-600 bg-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:border-[#5B5FC7] focus:ring-1 focus:ring-[#5B5FC7]"
                                        placeholder="Enter team ID..."
                                    />
                                </div>
                            </div>
                            <div className="mt-8 flex justify-end gap-3">
                                <button type="button" onClick={() => setShowJoinModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition">Cancel</button>
                                <button type="submit" className="bg-[#5B5FC7] hover:bg-[#464EB8] text-white px-4 py-2 rounded-md font-semibold text-sm transition">Join</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Add Member Modal */}
            {showAddMemberModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-slideIn flex flex-col max-h-[80vh]">
                        <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-xl text-gray-100">Add Member</h3>
                            <button onClick={() => setShowAddMemberModal(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
                            </button>
                        </div>
                        <form onSubmit={handleAddMember} className="p-6 flex-1 overflow-y-auto">
                            <label className="block text-sm font-semibold text-gray-300 mb-3">Select User to Add</label>
                            <div className="space-y-2 border border-gray-600 rounded-lg p-2 max-h-64 overflow-y-auto">
                                {allUsers.length === 0 ? (
                                    <p className="text-gray-400 text-sm text-center py-4">No users available</p>
                                ) : (
                                    allUsers.map(u => {
                                        // Don't show users already in the team
                                        const isMember = selectedGroup?.members?.some(m => (m._id || m) === u._id);
                                        if (isMember) return null;
                                        return (
                                            <div 
                                                key={u._id} 
                                                onClick={() => setSelectedUserToAdd(u._id)}
                                                className={`p-2 rounded-md cursor-pointer flex items-center justify-between transition ${selectedUserToAdd === u._id ? 'bg-gray-700 ring-1 ring-[#5B5FC7]' : 'hover:bg-gray-700'}`}
                                            >
                                                <div>
                                                    <p className="text-sm font-semibold text-gray-200">{u.name}</p>
                                                    <p className="text-xs text-gray-400">{u.email}</p>
                                                </div>
                                                {selectedUserToAdd === u._id && (
                                                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="#5B5FC7" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                            <div className="mt-8 flex justify-end gap-3 border-t border-gray-700 pt-4">
                                <button type="button" onClick={() => setShowAddMemberModal(false)} className="px-4 py-2 text-sm font-semibold text-gray-400 hover:bg-gray-700 hover:text-white rounded-md transition">Cancel</button>
                                <button type="submit" disabled={!selectedUserToAdd} className="bg-[#5B5FC7] hover:bg-[#464EB8] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md font-semibold text-sm transition">Add to Team</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
