import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { API_BASE } from "../config/api";

const fmt = (iso) => new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const SendIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>;
const ChatIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>;
const InviteIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16 11c1.657 0 3-1.343 3-3s-1.343-3-3-3M21 21v-2a4 4 0 00-3-3.87M13 7a4 4 0 11-8 0 4 4 0 018 0zM3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2"/></svg>;
const BackIcon = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>;

const MessageItem = ({ msg, isOwn, onReply, onReact }) => {
    const [showPicker, setShowPicker] = useState(false);

    if (msg.system) {
        return (
            <div className="flex justify-center my-4">
                <span className="text-xs font-semibold text-gray-500 bg-gray-800 px-4 py-1.5 rounded-md shadow-sm border border-gray-700">{msg.message}</span>
            </div>
        );
    }

    const handleReact = (emoji) => {
        onReact(msg._id, emoji);
        setShowPicker(false);
    };

    const reactions = msg.reactions || {};

    return (
        <div className={`flex gap-3 px-4 py-2 hover:bg-gray-800/40 transition-colors group relative ${isOwn ? 'bg-transparent' : ''}`}>
            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-[#5B5FC7] to-purple-600 flex-shrink-0 flex items-center justify-center font-bold text-white shadow-sm mt-0.5">
                {msg.sender?.[0]?.toUpperCase() || '?'}
            </div>
            
            <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="font-bold text-sm text-gray-100">{msg.sender}</span>
                    <span className="text-[11px] text-gray-400 font-medium">{fmt(msg.timestamp)}</span>
                </div>
                
                {msg.replyTo && (
                    <div className="mb-1.5 bg-gray-800/80 border-l-2 border-[#5B5FC7] pl-2.5 py-1 pr-2 rounded-r-md opacity-80 cursor-default">
                        <p className="text-[10px] font-bold text-[#5B5FC7] mb-0.5">{msg.replyTo.sender}</p>
                        <p className="text-xs text-gray-400 truncate line-clamp-2 leading-tight">{msg.replyTo.message}</p>
                    </div>
                )}
                
                <div className="text-sm text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                    {msg.message}
                </div>
                {Object.keys(reactions).length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {Object.entries(reactions).map(([emoji, users]) => (
                            <button key={emoji} onClick={() => handleReact(emoji)} className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2 py-0.5 rounded-full text-xs transition">
                                <span>{emoji}</span>
                                <span className="text-gray-400 font-medium">{Array.isArray(users) ? users.length : users}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
            
            <div className="hidden group-hover:flex items-center gap-1 bg-gray-800 border border-gray-700 rounded-md p-1 shadow-sm absolute right-6 -top-3 z-10">
                <button onClick={() => setShowPicker(!showPicker)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Add Reaction">
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
                </button>
                <button onClick={() => onReply(msg)} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Reply"><svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/></svg></button>
            </div>

            {showPicker && (
                <div className="absolute right-6 top-8 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-xl flex gap-1 z-20">
                    {['👍', '❤️', '😂', '🎉', '🚀'].map(emoji => (
                        <button key={emoji} onClick={() => handleReact(emoji)} className="hover:bg-gray-700 p-1.5 rounded text-lg transition">
                            {emoji}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

const InviteModal = ({ onClose, token }) => {
    const { sendInvitation, allOnlineUsers, roomUsers, refreshOnlineUsers } = useChat();
    const [friends, setFriends] = useState([]);
    const [loading, setLoading] = useState(true);
    const [countdowns, setCountdowns] = useState({});
    const intervalRefs = useRef({});

    useEffect(() => {
        refreshOnlineUsers();
        fetch(`${API_BASE}/friends/list`, { headers: { Authorization: `Bearer ${token}` } })
            .then((r) => r.json())
            .then((d) => { setFriends(d.friends || []); setLoading(false); })
            .catch(() => setLoading(false));
        return () => {
            const refs = intervalRefs.current;
            Object.values(refs).forEach(({ push, tick }) => { clearInterval(push); clearInterval(tick); });
        };
    }, [token, refreshOnlineUsers]);

    const onlineIds = new Set(allOnlineUsers.map((u) => u.userId));
    const inRoomIds = new Set((roomUsers || []).map((u) => u.userId));

    const startRepeat = (fId) => {
        if (intervalRefs.current[fId]) return;
        sendInvitation(fId);
        let secs = 60;
        setCountdowns((p) => ({ ...p, [fId]: secs }));
        const tick = setInterval(() => {
            secs = Math.max(0, secs - 1);
            setCountdowns((p) => ({ ...p, [fId]: secs }));
            if (secs === 0) secs = 60;
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
            <div className="bg-gray-900 border border-gray-700 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                    <h2 className="font-bold text-white flex items-center gap-2"><InviteIcon /> Invite Friends</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
                </div>
                <div className="p-4 max-h-[360px] overflow-y-auto">
                    {loading ? (
                        <p className="text-center text-gray-500 py-8 text-sm">Loading…</p>
                    ) : friends.length === 0 ? (
                        <p className="text-center text-gray-500 py-8 text-sm">No friends yet.</p>
                    ) : (
                        <ul className="flex flex-col gap-2">
                            {friends.map((f) => {
                                const fId = f._id?.toString();
                                const online = onlineIds.has(fId);
                                const inRoom = inRoomIds.has(fId);
                                const active = countdowns[fId] !== undefined;

                                if (inRoom) return null;

                                return (
                                    <li key={f._id} className="flex items-center justify-between bg-gray-800/50 rounded-xl p-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-purple-500 flex items-center justify-center font-bold text-sm text-white">
                                                    {f.name?.[0]?.toUpperCase()}
                                                </div>
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-800 ${online ? 'bg-green-500' : 'bg-gray-600'}`} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-sm text-white">{f.name}</p>
                                                <p className={`text-xs ${online ? 'text-green-400' : 'text-gray-500'}`}>{online ? 'online' : 'offline'}</p>
                                            </div>
                                        </div>
                                        {online ? (
                                            active ? (
                                                <div className="text-right">
                                                    <p className="text-xs font-bold text-green-400">✓ Invited</p>
                                                    <button onClick={() => stopRepeat(fId)} className="text-[10px] text-red-400 hover:text-red-300">Cancel</button>
                                                </div>
                                            ) : (
                                                <button onClick={() => startRepeat(fId)} className="bg-violet-600 hover:bg-violet-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition">
                                                    Invite
                                                </button>
                                            )
                                        ) : (
                                            <span className="text-xs text-gray-500">Offline</span>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function ChatRoom({ isDmOnly = false, onAddMember }) {
    const { user, token } = useAuth();
    const { 
        inRoom, messages, typingUsers, onlineCount, currentUser, 
        roomUsers, sendMessage, sendReaction, sendTyping, leaveRoom, getSocket 
    } = useChat();
    const navigate = useNavigate();

    const [input, setInput] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [showInvite, setShowInvite] = useState(false);
    const [showMembers, setShowMembers] = useState(true);
    const bottomRef = useRef(null);

    useEffect(() => { 
        bottomRef.current?.scrollIntoView({ behavior: "smooth" }); 
    }, [messages, typingUsers]);

    if (!inRoom) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-950 text-gray-500 p-8 text-center h-full">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner">
                    <ChatIcon />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Select a Conversation</h2>
                <p className="max-w-md text-sm leading-relaxed">
                    Choose a {isDmOnly ? "friend" : "team"} from the sidebar to start messaging.
                </p>
            </div>
        );
    }

    const isDm = currentUser?.roomId?.startsWith("dm_");
    const friendId = isDm ? currentUser.roomId.replace("dm_", "").split("_").find(id => id !== user._id.toString()) : null;

    const handleSend = () => { 
        if (!input.trim()) return; 
        sendMessage(
            input.trim(), 
            replyingTo ? { messageId: replyingTo._id, sender: replyingTo.sender, message: replyingTo.message } : null
        );
        setInput(""); 
        setReplyingTo(null);
    };
    
    const handleKeyDown = (e) => { 
        if (e.key === "Enter" && !e.shiftKey) { 
            e.preventDefault(); 
            handleSend(); 
        } 
    };

    const handleCallFriend = async () => {
        if (!friendId) return;
        try {
            const res = await fetch(`${API_BASE}/meetings`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: 'Direct Call' })
            });
            const data = await res.json();
            if (data.success) {
                const meetingCode = data.data.meetingCode;
                const socket = getSocket();
                if (socket) socket.emit("call-user", { targetUserId: friendId, meetingCode });
                navigate(`/meet/${meetingCode}`);
            }
        } catch (e) { console.error("Failed to start call", e); }
    };

    const typingText =
        typingUsers.length === 0 ? null
        : typingUsers.length === 1 ? `${typingUsers[0]} is typing…`
        : `${typingUsers.join(", ")} are typing…`;

    return (
        <div className="flex-1 flex flex-col h-full bg-gray-900 relative">
            {showInvite && <InviteModal onClose={() => setShowInvite(false)} token={token} />}
            
            {/* Chat Header */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-gray-900 flex-shrink-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button onClick={() => leaveRoom()} className="md:hidden text-gray-400 hover:text-white p-2 -ml-2 rounded-lg hover:bg-gray-800 transition">
                        <BackIcon />
                    </button>
                    <div>
                        <h2 className="text-gray-100 font-bold text-lg flex items-center gap-2">
                            <span className="text-gray-500">{isDm ? '@' : '#'}</span>
                            {isDm ? currentUser?.dmFriendName : currentUser?.roomId}
                        </h2>
                        <p className="text-xs text-gray-400 mt-0.5">{isDm ? 'Direct Message' : `${onlineCount} members online`}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isDm && onAddMember && (
                        <button onClick={onAddMember} className="bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition border border-gray-700 shadow-sm">
                            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
                            <span className="hidden sm:inline">Add Member</span>
                        </button>
                    )}
                    {!isDm && (
                        <button 
                            onClick={() => setShowMembers(!showMembers)} 
                            className={`p-2 rounded-lg transition ${showMembers ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
                            title="Toggle Member List"
                        >
                            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </button>
                    )}
                    {isDm ? (
                        <button onClick={handleCallFriend} className="bg-green-500/10 hover:bg-green-500/20 text-green-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition border border-green-500/20 shadow-sm">
                            📞 <span className="hidden sm:inline">Call</span>
                        </button>
                    ) : (
                        <button onClick={() => setShowInvite(true)} className="bg-violet-600/10 hover:bg-violet-600/20 text-violet-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition border border-violet-500/20 shadow-sm">
                            <InviteIcon /> <span className="hidden sm:inline">Invite</span>
                        </button>
                    )}
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Messages Area */}
                <div className="flex-1 flex flex-col relative">
                    <main className="flex-1 overflow-y-auto pb-4 pt-2">
                        {messages.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                                <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                    <svg viewBox="0 0 24 24" width={28} height={28} fill="none" stroke="currentColor" strokeWidth={1.5}><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                                </div>
                                <p className="text-sm font-medium">
                                    {isDm ? `This is the beginning of your direct message history with @${currentUser?.dmFriendName}.` : `Welcome to the start of the #${currentUser?.roomId} channel.`}
                                </p>
                            </div>
                        )}
                        <div className="flex flex-col space-y-1">
                            {messages.map((msg, i) => (
                                <MessageItem 
                                    key={msg._id || i} 
                                    msg={msg} 
                                    isOwn={!msg.system && msg.sender === user?.name}
                                    onReply={setReplyingTo}
                                    onReact={sendReaction}
                                />
                            ))}
                        </div>
                        {typingText && (
                            <div className="flex items-center gap-2 px-6 py-2 text-xs text-[#5B5FC7] italic font-medium">
                                <div className="flex gap-1">
                                    <span className="dot w-1.5 h-1.5 bg-[#5B5FC7] rounded-full"/>
                                    <span className="dot w-1.5 h-1.5 bg-[#5B5FC7] rounded-full"/>
                                    <span className="dot w-1.5 h-1.5 bg-[#5B5FC7] rounded-full"/>
                                </div>
                                {typingText}
                            </div>
                        )}
                        <div ref={bottomRef}/>
                    </main>

                    {/* Input Area */}
                    <footer className="px-2 pb-2 pt-1 md:px-4 md:pb-6 md:pt-2">
                        {replyingTo && (
                            <div className="mx-1 md:mx-2 mb-0.5 bg-gray-800/80 px-3 py-1.5 md:px-4 md:py-2 border-l-2 border-[#5B5FC7] flex justify-between items-center rounded-t-lg shadow-sm backdrop-blur-md">
                                <div className="flex flex-col min-w-0 pr-4">
                                    <span className="text-[9px] md:text-[10px] text-[#5B5FC7] font-bold uppercase tracking-wider mb-0.5">Replying to {replyingTo.sender}</span>
                                    <span className="text-[11px] md:text-xs text-gray-300 truncate line-clamp-1">{replyingTo.message}</span>
                                </div>
                                <button onClick={() => setReplyingTo(null)} className="text-gray-500 hover:text-white p-1 rounded-full hover:bg-gray-700 transition">✕</button>
                            </div>
                        )}
                        <div className={`max-w-[100%] border border-gray-700 bg-gray-800 focus-within:border-[#5B5FC7] focus-within:ring-1 focus-within:ring-[#5B5FC7] transition-all shadow-sm ${replyingTo ? 'rounded-b-lg rounded-tr-lg md:rounded-b-2xl md:rounded-tr-2xl' : 'rounded-2xl'}`}>
                            <div className="flex items-end">
                                <textarea 
                                    rows={1} 
                                    value={input}
                                    onChange={(e) => { setInput(e.target.value); sendTyping(); }}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isDm ? `Message @${currentUser?.dmFriendName}` : `Message #${currentUser?.roomId}`}
                                    className="flex-1 bg-transparent pl-4 pr-2 py-3 md:pl-5 md:pr-3 md:py-3.5 text-[13px] md:text-sm text-gray-100 placeholder-gray-500 resize-none outline-none max-h-32 md:max-h-48 overflow-y-auto"
                                    style={{ minHeight: '44px' }}
                                />
                                <button 
                                    onClick={handleSend} 
                                    disabled={!input.trim()}
                                    className={`mb-1.5 mr-1.5 md:mb-2 md:mr-2 p-2 rounded-xl transition flex items-center justify-center flex-shrink-0 ${input.trim() ? 'bg-[#5B5FC7] hover:bg-[#464EB8] text-white shadow-sm' : 'bg-transparent text-gray-600'}`}
                                >
                                    <SendIcon />
                                </button>
                            </div>
                        </div>
                        <p className="hidden md:block text-center text-[10px] text-gray-500 mt-2 font-medium tracking-wide">
                            Pro tip: Press <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700 font-mono">Enter</kbd> to send, <kbd className="bg-gray-800 px-1 py-0.5 rounded border border-gray-700 font-mono">Shift + Enter</kbd> for new line
                        </p>
                    </footer>
                </div>

                {/* Group Member Sidebar (Hidden in DM) */}
                {!isDm && showMembers && (
                    <aside className="hidden lg:flex flex-col w-60 border-l border-gray-800 bg-gray-950 flex-shrink-0">
                        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Members — {roomUsers.length}
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto py-2">
                            {roomUsers.map((u) => (
                                <div key={u.userId} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-800 transition cursor-default">
                                    <div className="relative">
                                        <div className="w-8 h-8 rounded bg-gradient-to-br from-[#5B5FC7] to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-sm">
                                            {u.name?.[0]?.toUpperCase()}
                                        </div>
                                        <span className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-950"/>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-200 block truncate">{u.name}</span>
                                        {u.name === user?.name && <span className="text-[10px] text-gray-500 font-medium">You</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}
