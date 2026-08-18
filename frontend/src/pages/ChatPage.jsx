import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { API_BASE } from "../config/api";
import InviteToast from "../components/InviteToast";
import ChatRoom from "../components/ChatRoom";

const API = API_BASE;

/* ── Global styles injected once ─────────────────────────────────────────── */
const GlobalStyles = () => (
    <style>{`
        @keyframes fadeUp   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn  { from{transform:translateX(110%);opacity:0} to{transform:translateX(0);opacity:1} }
        @keyframes blink    { 0%,80%,100%{opacity:0} 40%{opacity:1} }
        @keyframes pulse-glow { 0%,100%{box-shadow:0 0 0 0 rgba(139,92,246,.5)} 50%{box-shadow:0 0 0 6px rgba(139,92,246,0)} }
        .fade-up      { animation: fadeUp   .35s ease-out; }
        .slide-in     { animation: slideIn  .3s  ease-out; }
        .msg-in       { animation: fadeUp   .2s  ease-out; }
        .animate-slideIn { animation: slideIn .3s ease-out; }
        .dot          { animation: blink 1.4s infinite both; }
        .dot:nth-child(2) { animation-delay:.2s; }
        .dot:nth-child(3) { animation-delay:.4s; }
        ::-webkit-scrollbar        { width:5px; height:5px; }
        ::-webkit-scrollbar-track  { background:transparent; }
        ::-webkit-scrollbar-thumb  { background:#374151; border-radius:99px; }
    `}</style>
);

/* ── ChatPage root (Master-Detail Split View) ────────────────────────────── */
const ChatPage = () => {
    const { isAuthenticated, user, token } = useAuth();
    const { 
        inRoom, joinRoom, connect, currentUser, allOnlineUsers
    } = useChat();
    const navigate = useNavigate();

    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLF] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/login", { replace: true });
        } else {
            connect();
        }
    }, [isAuthenticated, navigate, connect]);

    useEffect(() => {
        if (!token) return;
        fetch(`${API}/friends/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { setFriends(d.friends || []); setLF(false); })
            .catch(() => setLF(false));
    }, [token]);

    if (!isAuthenticated) return null;

    const onlineIds = new Set(allOnlineUsers.map((u) => u.userId));
    const isDm = currentUser?.roomId?.startsWith("dm_");

    const handleJoinDm = (fId, fName) => {
        const ids = [user._id, fId].sort();
        joinRoom(`dm_${ids[0]}_${ids[1]}`, user.name, fName);
    };

    return (
        <div className="flex w-full h-full bg-gray-950 overflow-hidden relative">
            <GlobalStyles />
            <InviteToast />

            {/* ── LEFT SIDEBAR: Friends (DMs Only) ── */}
            <div className={`w-full md:w-72 lg:w-80 flex-col border-r border-gray-800 bg-gray-950 flex-shrink-0 transition-all ${inRoom ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-100">Direct Messages</h2>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                    <div className="p-3">
                        <p className="text-[11px] font-extrabold text-gray-500 uppercase tracking-widest mb-3 px-1">Friends</p>
                        {loadingFriends ? (
                            <p className="text-gray-500 text-sm text-center py-4">Loading friends...</p>
                        ) : friends.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-500 text-sm">No friends yet.</p>
                                <button onClick={() => navigate("/friends")} className="text-violet-400 text-xs font-semibold mt-2 hover:text-violet-300">Add Friends →</button>
                            </div>
                        ) : (
                            <ul className="space-y-1">
                                {friends.map((f) => {
                                    const online = onlineIds.has(f._id?.toString());
                                    const isSelected = isDm && currentUser?.dmFriendName === f.name;
                                    return (
                                        <li key={f._id}>
                                            <button
                                                onClick={() => handleJoinDm(f._id?.toString(), f.name)}
                                                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-left ${
                                                    isSelected 
                                                        ? 'bg-gray-800 text-gray-100' 
                                                        : 'text-gray-300 hover:bg-gray-800/50 hover:text-gray-100'
                                                }`}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-8 h-8 rounded bg-gradient-to-br from-[#5B5FC7] to-purple-500 flex items-center justify-center font-bold text-xs text-white shadow-sm">
                                                        {f.name[0].toUpperCase()}
                                                    </div>
                                                    <span className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-950 ${online ? "bg-green-500" : "bg-gray-600"}`} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm truncate ${isSelected ? 'font-bold' : 'font-medium'}`}>{f.name}</p>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>
            </div>

            {/* ── RIGHT MAIN AREA: Chat Room ── */}
            <div className={`flex-1 flex-col min-w-0 relative ${!inRoom ? 'hidden md:flex' : 'flex'}`}>
                <ChatRoom isDmOnly={true} />
            </div>
        </div>
    );
};

export default ChatPage;
