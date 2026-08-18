import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { API_BASE } from "../config/api";
import InviteToast from "../components/InviteToast";

/* ── Utilities ───────────────────────────────────────────────────────────── */
const fmt = (iso) =>
    new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

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

/* ── SVG Icons ───────────────────────────────────────────────────────────── */
const SendIcon   = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const ChatIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>;
const PlusIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>;
const LeaveIcon  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>;
const BackIcon   = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>;
const InviteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3M21 21v-2a4 4 0 00-3-3.87M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>;
const DmIcon     = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>;

/* InviteToast is imported from ../components/InviteToast */


/* ── InviteModal (invite friend to current group room) ───────────────────── */
const InviteModal = ({ onClose, token }) => {
    const { sendInvitation, allOnlineUsers, roomUsers, refreshOnlineUsers } = useChat();
    const [friends,      setFriends]      = useState([]);
    const [loading,      setLoading]      = useState(true);
    const [countdowns,   setCountdowns]   = useState({}); // fId → remaining secs
    const intervalRefs   = useRef({}); // fId → { push, tick }

    useEffect(() => {
        refreshOnlineUsers();
        fetch(`${API}/friends/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { setFriends(d.friends || []); setLoading(false); })
            .catch(() => setLoading(false));
        // Cleanup all intervals on close
        return () => {
            const refs = intervalRefs.current;
            Object.values(refs).forEach(({ push, tick }) => { clearInterval(push); clearInterval(tick); });
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const onlineIds = new Set(allOnlineUsers.map((u) => u.userId));
    const inRoomIds = new Set((roomUsers || []).map((u) => u.userId));

    const startRepeat = (fId) => {
        if (intervalRefs.current[fId]) return; // already active
        sendInvitation(fId); // immediate first push

        let secs = 60;
        setCountdowns((p) => ({ ...p, [fId]: secs }));

        const tick = setInterval(() => {
            secs = Math.max(0, secs - 1);
            setCountdowns((p) => ({ ...p, [fId]: secs }));
            if (secs === 0) secs = 60; // visual reset on next cycle
        }, 1000);

        const push = setInterval(() => {
            if (inRoomIds.has(fId)) { stopRepeat(fId); return; }
            sendInvitation(fId);
        }, 60_000);

        intervalRefs.current[fId] = { push, tick };
    };

    const stopRepeat = (fId) => {
        const r = intervalRefs.current[fId];
        if (r) { clearInterval(r.push); clearInterval(r.tick); delete intervalRefs.current[fId]; }
        setCountdowns((p) => { const n = { ...p }; delete n[fId]; return n; });
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, width: '100%', maxWidth: 440, fontFamily: 'Inter, sans-serif', boxShadow: '0 24px 64px rgba(0,0,0,.6)' }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.1rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h2 style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <InviteIcon /> Invite to Room
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1.2rem', lineHeight: 1 }}>✕</button>
                </div>
                {/* Body */}
                <div style={{ padding: '1rem', maxHeight: 360, overflowY: 'auto' }}>
                    {loading ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 0', fontSize: '.875rem' }}>Loading…</p>
                    ) : friends.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '.875rem', padding: '2rem 0' }}>No friends yet.</p>
                    ) : (
                        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {friends.map((f) => {
                                const fId    = f._id?.toString();
                                const online = onlineIds.has(fId);
                                const inRoom = inRoomIds.has(fId);
                                const active = countdowns[fId] !== undefined;

                                // ▶ Hide friends already in this room
                                if (inRoom) return null;

                                return (
                                    <li key={f._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card2)', borderRadius: 12, padding: '.75rem 1rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                            <div style={{ position: 'relative' }}>
                                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.875rem', color: 'white', flexShrink: 0 }}>
                                                    {f.name?.[0]?.toUpperCase()}
                                                </div>
                                                <span style={{ position: 'absolute', bottom: 0, right: 0, width: 10, height: 10, borderRadius: '50%', background: online ? '#22c55e' : '#374151', border: '2px solid var(--bg-card2)' }} />
                                            </div>
                                            <div>
                                                <p style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text-primary)' }}>{f.name}</p>
                                                <p style={{ fontSize: '.72rem', color: online ? '#4ade80' : 'var(--text-secondary)', fontWeight: 500 }}>
                                                    {online ? '● online' : 'offline'}
                                                </p>
                                            </div>
                                        </div>

                                        {online ? (
                                            active ? (
                                                <div style={{ textAlign: 'right' }}>
                                                    <p style={{ fontSize: '.72rem', fontWeight: 700, color: '#4ade80' }}>✓ Invited</p>
                                                    <p style={{ fontSize: '.68rem', color: 'var(--text-secondary)' }}>
                                                        Retry in {countdowns[fId]}s
                                                    </p>
                                                    <button onClick={() => stopRepeat(fId)}
                                                        style={{ fontSize: '.68rem', color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startRepeat(fId)}
                                                    style={{ padding: '.45rem .9rem', borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#818cf8)', color: 'white', border: 'none', fontWeight: 700, fontSize: '.8rem', cursor: 'pointer', transition: 'filter .15s' }}
                                                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.2)'}
                                                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
                                                    Invite
                                                </button>
                                            )
                                        ) : (
                                            <span style={{ fontSize: '.75rem', color: 'var(--text-secondary)' }}>Offline</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
                <div style={{ padding: '.75rem 1.5rem', borderTop: '1px solid var(--border)', fontSize: '.72rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                    Push notification sent every minute until friend joins · Friends in room are hidden
                </div>
            </div>
        </div>
    );
};

/* ── Message Bubble ──────────────────────────────────────────────────────── */
const MessageBubble = ({ msg, isOwn }) => {
    if (msg.system) {
        return (
            <div className="flex justify-center my-2">
                <span className="text-xs text-gray-500 bg-gray-800/60 px-3 py-1 rounded-full">{msg.message}</span>
            </div>
        );
    }
    return (
        <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-3`}>
            <div className={`max-w-xs lg:max-w-md flex flex-col ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && <span className="text-xs text-violet-400 font-semibold mb-1 ml-1">{msg.sender}</span>}
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-md ${
                    isOwn
                        ? "bg-gradient-to-br from-violet-600 to-purple-700 text-white rounded-tr-sm"
                        : "bg-gray-800 text-gray-100 border border-gray-700/60 rounded-tl-sm"
                }`}>
                    {msg.message}
                </div>
                <span className="text-xs text-gray-600 mt-1 mx-1">{fmt(msg.timestamp)}</span>
            </div>
        </div>
    );
};

/* ── PrivateRoomHub (replaces old Lobby) ─────────────────────────────────── */
const PrivateRoomHub = ({ onJoinDm, onJoinGroup }) => {
    const { user, token }             = useAuth();
    const { allOnlineUsers, error }   = useChat();
    const navigate                    = useNavigate();
    const [friends, setFriends]       = useState([]);
    const [loadingFriends, setLF]     = useState(true);
    const [showGroupForm, setShowGF]  = useState(false);
    const [groupName, setGroupName]   = useState("");

    useEffect(() => {
        if (!token) return;
        fetch(`${API}/friends/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { setFriends(d.friends || []); setLF(false); })
            .catch(() => setLF(false));
    }, [token]);

    const onlineIds = new Set(allOnlineUsers.map((u) => u.userId));

    const handleGroupJoin = (e) => {
        e.preventDefault();
        if (groupName.trim()) onJoinGroup(groupName.trim());
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-violet-950 flex items-center justify-center p-4">
            <GlobalStyles />
            <InviteToast />

            <div className="w-full max-w-lg fade-up">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="relative inline-block mb-4">
                        <div className="absolute inset-0 bg-violet-500 rounded-3xl opacity-20 blur-xl"/>
                        <div className="relative bg-gradient-to-br from-violet-600 to-purple-700 p-5 rounded-3xl shadow-2xl shadow-violet-900/60">
                            <ChatIcon />
                        </div>
                    </div>
                    <h1 className="text-4xl font-extrabold bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent">
                        LiveChat
                    </h1>
                    <p className="text-gray-400 mt-1 text-sm">Private rooms · Real-time · WebSocket</p>
                </div>

                <div className="bg-gray-900/80 backdrop-blur-xl border border-gray-700/60 rounded-3xl overflow-hidden shadow-2xl">
                    {/* User badge */}
                    <div className="px-6 py-4 border-b border-gray-800 bg-violet-900/20 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {user?.name?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-white text-sm font-semibold truncate">{user?.name}</p>
                            <p className="text-gray-400 text-xs truncate">{user?.email}</p>
                        </div>
                        <span className="ml-auto text-xs bg-green-500/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full whitespace-nowrap">
                            ● Online
                        </span>
                    </div>

                    {error && (
                        <div className="mx-6 mt-4 bg-red-500/10 border border-red-500/40 rounded-xl p-3 text-red-300 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Friends list */}
                    <div className="px-6 pt-5 pb-2">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                            💬 Friends — click to message
                        </p>

                        {loadingFriends ? (
                            <div className="text-center text-gray-500 py-6 text-sm">Loading friends…</div>
                        ) : friends.length === 0 ? (
                            <div className="text-center py-6 text-gray-600 text-sm space-y-1">
                                <p className="text-2xl">🤝</p>
                                <p>No friends yet.</p>
                                <button onClick={() => navigate("/friends")}
                                    className="mt-1 text-violet-400 hover:text-violet-300 text-xs font-semibold transition">
                                    + Add Friends →
                                </button>
                            </div>
                        ) : (
                            <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                                {friends.map((f) => {
                                    const online = onlineIds.has(f._id?.toString());
                                    return (
                                        <li key={f._id}>
                                            <button
                                                onClick={() => onJoinDm(f._id?.toString(), f.name)}
                                                className="w-full flex items-center gap-3 bg-gray-800 hover:bg-gray-700/80 border border-gray-700/50 hover:border-violet-500/40 rounded-xl px-4 py-3 transition group text-left"
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-700 to-purple-800 flex items-center justify-center text-white font-bold text-sm">
                                                        {f.name[0].toUpperCase()}
                                                    </div>
                                                    <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-gray-800 ${online ? "bg-green-400" : "bg-gray-600"}`}/>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-white text-sm font-semibold truncate group-hover:text-violet-200 transition">{f.name}</p>
                                                    <p className={`text-xs ${online ? "text-green-400" : "text-gray-500"}`}>
                                                        {online ? "● online" : "offline"}
                                                    </p>
                                                </div>
                                                <span className="flex items-center gap-1 text-xs text-gray-500 group-hover:text-violet-400 transition">
                                                    <DmIcon /> DM
                                                </span>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    {/* Group room creator */}
                    <div className="px-6 pt-4 pb-6">
                        <div className="border-t border-gray-800 pt-4">
                            {!showGroupForm ? (
                                <button
                                    onClick={() => setShowGF(true)}
                                    className="w-full flex items-center justify-center gap-2 border border-dashed border-gray-600 hover:border-violet-500/60 hover:bg-violet-900/10 text-gray-400 hover:text-violet-300 py-3 rounded-xl text-sm font-medium transition"
                                >
                                    <PlusIcon /> Create a Group Room
                                </button>
                            ) : (
                                <form onSubmit={handleGroupJoin} className="space-y-3 fade-up">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Group Room Name</p>
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={groupName}
                                            onChange={(e) => setGroupName(e.target.value)}
                                            placeholder="e.g. team-alpha, general"
                                            className="flex-1 bg-gray-800 border border-gray-700 hover:border-gray-600 focus:border-violet-500 rounded-xl px-4 py-2.5 text-white placeholder-gray-500 text-sm focus:outline-none transition"
                                        />
                                        <button type="submit" disabled={!groupName.trim()}
                                            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition">
                                            Join
                                        </button>
                                        <button type="button" onClick={() => { setShowGF(false); setGroupName(""); }}
                                            className="text-gray-500 hover:text-gray-300 px-2 transition text-lg">✕</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>

                <button onClick={() => navigate("/dashboard")}
                    className="mt-5 w-full flex items-center justify-center gap-2 text-gray-500 hover:text-gray-300 text-xs transition">
                    <BackIcon /> Back to Dashboard
                </button>
            </div>
        </div>
    );
};

/* ── ChatRoom ─────────────────────────────────────────────────────────────── */
const ChatRoom = () => {
    const { user, token } = useAuth();
    const {
        messages, typingUsers, onlineCount, currentUser,
        roomUsers, sendMessage, sendTyping, leaveRoom,
    } = useChat();
    const [input,      setInput]      = useState("");
    const [showInvite, setShowInvite] = useState(false);
    const bottomRef                   = useRef(null);
    const navigate                    = useNavigate();

    const isDm         = currentUser?.roomId?.startsWith("dm_");
    const displayTitle = isDm ? currentUser?.dmFriendName || "Direct Message" : `# ${currentUser?.roomId}`;
    const displaySub   = isDm ? "Private message" : `${onlineCount} online`;
    const placeholder  = isDm ? `Message ${currentUser?.dmFriendName || "friend"}…` : `Message ${displayTitle}…`;

    useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, typingUsers]);

    const handleSend   = () => { if (!input.trim()) return; sendMessage(input.trim()); setInput(""); };
    const handleKeyDown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } };
    const handleLeave  = () => { leaveRoom(); navigate("/dashboard"); };

    const typingText =
        typingUsers.length === 0 ? null
        : typingUsers.length === 1 ? `${typingUsers[0]} is typing…`
        : `${typingUsers.join(", ")} are typing…`;

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
            <GlobalStyles />
            <InviteToast />
            {showInvite && <InviteModal onClose={() => setShowInvite(false)} token={token} />}

            {/* ── Sidebar ── */}
            <aside className="hidden md:flex flex-col w-56 bg-gray-900 border-r border-gray-800 flex-shrink-0">
                <div className="p-4 border-b border-gray-800">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
                        {isDm ? "💬 Direct Message" : `# ${currentUser?.roomId}`}
                    </p>
                    <p className="text-xs text-gray-600">{displaySub}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1">
                    {roomUsers.map((u) => (
                        <div key={u.userId} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-800 transition">
                            <span className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"/>
                            <span className="text-sm text-gray-200 truncate">{u.name}</span>
                            {u.name === user?.name && <span className="ml-auto text-xs text-gray-600">(you)</span>}
                        </div>
                    ))}
                </div>

                {/* Self badge */}
                <div className="p-3 border-t border-gray-800 bg-gray-900/80">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {user?.name?.[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
                            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* ── Main ── */}
            <div className="flex flex-col flex-1 min-w-0">
                {/* Header */}
                <header className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 px-4 py-3 flex items-center justify-between flex-shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isDm ? "bg-fuchsia-600/20 border border-fuchsia-500/30" : "bg-violet-600/20 border border-violet-500/30"}`}>
                            {isDm ? <DmIcon /> : <ChatIcon />}
                        </div>
                        <div>
                            <h2 className="font-bold text-base leading-tight">{displayTitle}</h2>
                            <p className="text-gray-500 text-xs">{displaySub}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Invite — only for group rooms */}
                        {!isDm && (
                            <button onClick={() => setShowInvite(true)}
                                className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/40 border border-violet-500/30 text-violet-300 hover:text-violet-100 px-3 py-1.5 rounded-full text-xs font-semibold transition">
                                <InviteIcon /> Invite
                            </button>
                        )}
                        <button onClick={handleLeave}
                            className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 border border-red-500/30 text-red-300 hover:text-red-200 px-3 py-1.5 rounded-full text-xs font-semibold transition">
                            <LeaveIcon /> Leave
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <main className="flex-1 overflow-y-auto px-4 py-4">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-gray-600 gap-3">
                            {isDm ? <DmIcon /> : <ChatIcon />}
                            <p className="text-sm">{isDm ? `Say hi to ${currentUser?.dmFriendName}! 👋` : "No messages yet — say hello! 👋"}</p>
                        </div>
                    )}
                    {messages.map((msg, i) => (
                        <div key={i} className="msg-in">
                            <MessageBubble msg={msg} isOwn={!msg.system && msg.sender === user?.name}/>
                        </div>
                    ))}
                    {typingText && (
                        <div className="flex items-center gap-2 pl-1 text-xs text-gray-400 italic">
                            <div className="flex gap-0.5">
                                <span className="dot w-1.5 h-1.5 bg-gray-400 rounded-full"/>
                                <span className="dot w-1.5 h-1.5 bg-gray-400 rounded-full"/>
                                <span className="dot w-1.5 h-1.5 bg-gray-400 rounded-full"/>
                            </div>
                            {typingText}
                        </div>
                    )}
                    <div ref={bottomRef}/>
                </main>

                {/* Input */}
                <footer className="bg-gray-900/90 backdrop-blur-md border-t border-gray-800 px-4 py-3 flex-shrink-0">
                    <div className="flex items-end gap-3 max-w-4xl mx-auto">
                        <textarea id="chat-input" rows={1} value={input}
                            onChange={(e) => { setInput(e.target.value); sendTyping(); }}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 bg-gray-800 border border-gray-700 hover:border-gray-600 focus:border-violet-500 rounded-2xl px-4 py-3 text-sm text-white placeholder-gray-500 resize-none focus:outline-none transition max-h-32 overflow-y-auto"
                        />
                        <button onClick={handleSend} disabled={!input.trim()}
                            className="flex-shrink-0 bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-2xl transition shadow-lg shadow-violet-900/50 transform hover:scale-105 disabled:hover:scale-100">
                            <SendIcon />
                        </button>
                    </div>
                    <p className="text-center text-xs text-gray-700 mt-2">
                        <kbd className="bg-gray-800 border border-gray-700 rounded px-1">Enter</kbd> to send ·{" "}
                        <kbd className="bg-gray-800 border border-gray-700 rounded px-1">Shift+Enter</kbd> for new line
                    </p>
                </footer>
            </div>
        </div>
    );
};

/* ── ChatPage root ───────────────────────────────────────────────────────── */
const ChatPage = () => {
    const { isAuthenticated, user } = useAuth();
    const { inRoom, joinRoom, connect } = useChat();
    const navigate = useNavigate();

    // Redirect unauthenticated users
    useEffect(() => {
        if (!isAuthenticated) navigate("/login", { replace: true });
        else connect(); // Establish socket connection early
    }, [isAuthenticated]);

    if (!isAuthenticated) return null;

    const handleJoinDm = (friendId, friendName) => {
        const ids = [user._id, friendId].sort();
        joinRoom(`dm_${ids[0]}_${ids[1]}`, user.name, friendName);
    };

    const handleJoinGroup = (roomName) => {
        joinRoom(roomName, user.name);
    };

    if (!inRoom) return <PrivateRoomHub onJoinDm={handleJoinDm} onJoinGroup={handleJoinGroup} />;
    return <ChatRoom />;
};

export default ChatPage;
