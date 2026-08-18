import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { API_BASE } from '../config/api';
import InviteToast from './InviteToast';

const IncomingCallModal = ({ callerName, meetingCode, onAccept, onDecline }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl animate-slideIn">
                <div className="w-20 h-20 bg-violet-600/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse-glow">
                    <div className="w-16 h-16 bg-violet-600 rounded-full flex items-center justify-center text-white text-3xl">
                        📞
                    </div>
                </div>
                <h2 className="text-xl text-white font-bold mb-2">Incoming Video Call</h2>
                <p className="text-gray-400 mb-8 font-medium">from <span className="text-violet-400 font-bold">{callerName}</span></p>
                <div className="flex gap-4">
                    <button 
                        onClick={onDecline}
                        className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 py-3 rounded-xl font-bold transition-all"
                    >
                        Decline
                    </button>
                    <button 
                        onClick={onAccept}
                        className="flex-1 bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-green-500/20"
                    >
                        Accept
                    </button>
                </div>
            </div>
        </div>
    );
};

export default function Layout({ children }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, token } = useAuth();
    const { connect, getSocket } = useChat();

    const [pendingCount, setPendingCount] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);

    useEffect(() => {
        connect();
        if (!token) return;
        
        // Fetch pending friend requests for the badge
        fetch(`${API_BASE}/friends/pending`, { 
            headers: { Authorization: `Bearer ${token}` } 
        })
        .then(r => r.json())
        .then(data => setPendingCount((data.requests || []).length))
        .catch(() => {});
        
        // Listen for incoming calls
        const socket = getSocket();
        if (socket) {
            const handleIncomingCall = (data) => {
                // data = { meetingCode, callerName }
                setIncomingCall(data);
                
                // Play ringtone (optional, browser policies might block this without user interaction)
                try {
                    const audio = new Audio('/ringtone.mp3'); // We don't have this file, but it's good practice
                    audio.play().catch(e => console.log('Audio autoplay blocked'));
                } catch (e) {}
            };
            socket.on('incoming-call', handleIncomingCall);
            return () => {
                socket.off('incoming-call', handleIncomingCall);
            };
        }
    }, [token, connect]);

    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });
    };

    const handleAcceptCall = () => {
        if (incomingCall?.meetingCode) {
            navigate(`/meet/${incomingCall.meetingCode}`);
        }
        setIncomingCall(null);
    };

    const handleDeclineCall = () => {
        setIncomingCall(null);
    };

    const navItems = [
        { key: 'dashboard', path: '/dashboard', label: 'Pulse', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
        { key: 'chat', path: '/chat', label: 'Whisper', icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
        { key: 'teams', path: '/teams', label: 'Squads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
        { key: 'calendar', path: '/calendar', label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { key: 'friends', path: '/friends', label: 'Network', icon: 'M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z', badge: pendingCount },
    ];

    const activeKey = location.pathname.split('/')[1] || 'dashboard';

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-['Segoe_UI',_system-ui,_-apple-system,_sans-serif] overflow-hidden">
            <InviteToast />
            
            {incomingCall && (
                <IncomingCallModal 
                    callerName={incomingCall.callerName} 
                    meetingCode={incomingCall.meetingCode}
                    onAccept={handleAcceptCall}
                    onDecline={handleDeclineCall}
                />
            )}

            {/* ── Teams Style Top Header ── */}
            <header className="flex items-center justify-between px-4 h-12 bg-[#464EB8] text-white flex-shrink-0 z-50">
                {/* Logo Area */}
                <div className="flex items-center gap-4 w-64">
                    <div className="w-8 h-8 rounded bg-white/20 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" width={18} height={18} fill="white"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                    </div>
                    <span className="font-semibold text-lg tracking-wide hidden sm:block">NexCall Hub</span>
                </div>

                {/* Center Search Bar (Mock) */}
                <div className="flex-1 max-w-2xl hidden md:flex items-center justify-center px-4">
                    <div className="w-full bg-white/20 hover:bg-white/30 transition-colors flex items-center px-3 py-1.5 rounded-md text-sm text-white focus-within:bg-white focus-within:text-gray-900 shadow-sm border border-transparent focus-within:border-[#5B5FC7]">
                        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        <input type="text" placeholder="Search (Ctrl+E)" className="bg-transparent border-none outline-none px-2 w-full placeholder-white/70 focus-within:placeholder-gray-500" />
                    </div>
                </div>

                {/* Right Profile Area */}
                <div className="flex items-center gap-3 w-64 justify-end">
                    <button className="p-1.5 hover:bg-white/10 rounded-full transition-colors hidden sm:block">
                        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    </button>
                    <div className="relative group cursor-pointer">
                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm text-white uppercase overflow-hidden border-2 border-[#464EB8]">
                            {user?.name?.[0] || 'U'}
                        </div>
                        {/* Dropdown Menu */}
                        <div className="absolute right-0 mt-1 w-48 bg-gray-800 rounded-md shadow-lg border border-gray-700 hidden group-hover:block z-50 text-gray-200">
                            <div className="px-4 py-3 border-b border-gray-700">
                                <p className="text-sm font-semibold truncate">{user?.name}</p>
                                <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                            </div>
                            <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors">
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* ── Main Body ── */}
            <div className="flex flex-1 overflow-hidden">
                
                {/* Teams Style Left Rail (Desktop) / Bottom Nav (Mobile) */}
                <nav className="flex md:flex-col bg-gray-950 border-r border-gray-800 w-full md:w-16 h-14 md:h-full z-40 order-last md:order-first fixed bottom-0 md:static flex-shrink-0 justify-around md:justify-start pt-0 md:pt-2">
                    {navItems.map(item => {
                        const isActive = activeKey === item.key;
                        return (
                            <button 
                                key={item.key} 
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center justify-center py-2 md:py-3 w-full relative transition-colors ${
                                    isActive 
                                        ? 'text-[#5B5FC7]' 
                                        : 'text-gray-400 hover:text-gray-200'
                                }`}
                                title={item.label}
                            >
                                {/* Active Indicator (Left border on desktop) */}
                                {isActive && <div className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-[#5B5FC7] rounded-r-md"></div>}
                                
                                <div className="relative">
                                    <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.5} strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                                    {item.badge > 0 && (
                                        <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 min-w-[16px] h-4 rounded-full flex items-center justify-center border border-gray-950">
                                            {item.badge > 9 ? '9+' : item.badge}
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] mt-1 hidden md:block ${isActive ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* Content Area */}
                <main className="flex-1 overflow-hidden relative flex flex-col bg-gray-900 mb-14 md:mb-0">
                    {children}
                </main>
            </div>
        </div>
    );
}
