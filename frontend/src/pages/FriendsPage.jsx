import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useChat } from "../contexts/ChatContext";
import { API_BASE } from "../config/api";

const API = API_BASE;

const apiFetch = (path, token, opts = {}) =>
    fetch(`${API}${path}`, {
        ...opts,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts.headers || {}) },
    });

const Avatar = ({ name, size = 38 }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: size * 0.36, flexShrink: 0, color: 'white' }}>
        {name?.[0]?.toUpperCase()}
    </div>
);

export default function FriendsPage() {
    const { token, user }                                      = useAuth();
    const { connect, sendInvitation, allOnlineUsers, inRoom, joinRoom } = useChat();
    const navigate                                             = useNavigate();

    const [friends, setFriends] = useState([]);
    const [pending, setPending] = useState([]);
    const [sent,    setSent]    = useState([]);
    const [loading, setLoading] = useState(true);
    const [email,   setEmail]   = useState("");
    const [addStatus, setAddStatus] = useState(null);
    const [addLoading, setAddLoading] = useState(false);

    const onlineIds = new Set(allOnlineUsers.map(u => u.userId));

    const loadAll = useCallback(async () => {
        setLoading(true);
        try {
            const [fl, pl, sl] = await Promise.all([
                apiFetch("/friends/list",    token).then(r => r.json()),
                apiFetch("/friends/pending", token).then(r => r.json()),
                apiFetch("/friends/sent",    token).then(r => r.json()),
            ]);
            setFriends(fl.friends || []);
            setPending(pl.requests || []);
            setSent(sl.requests || []);
        } catch {}
        setLoading(false);
    }, [token]);

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadAll(); connect(); }, []);

    const handleAddFriend = async (e) => {
        e.preventDefault();
        if (!email.trim()) return;
        setAddLoading(true);
        setAddStatus(null);
        try {
            const res  = await apiFetch("/friends/request", token, { method: "POST", body: JSON.stringify({ email: email.trim() }) });
            const data = await res.json();
            if (res.ok) { setAddStatus({ type: "success", msg: `Request sent to ${email.trim()}` }); setEmail(""); loadAll(); }
            else         { setAddStatus({ type: "error",   msg: data.message || "Failed" }); }
        } catch (err) { setAddStatus({ type: "error", msg: err.message || "Cannot reach server — check your connection" }); }
        setAddLoading(false);
    };


    const handleRespond = async (id, action) => { await apiFetch(`/friends/respond/${id}`, token, { method: "POST", body: JSON.stringify({ action }) }); loadAll(); };
    const handleRemove  = async (id) => { if (!window.confirm("Remove this friend?")) return; await apiFetch(`/friends/${id}`, token, { method: "DELETE" }); loadAll(); };
    const handleDM      = (f) => { const ids = [user._id, f._id.toString()].sort(); joinRoom(`dm_${ids[0]}_${ids[1]}`, user.name, f.name); navigate("/chat"); };

    return (
        <div style={{ minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Top nav */}
            <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,9,13,.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', padding: 'clamp(.6rem,3vw,1rem) clamp(.75rem,4vw,2rem)', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate("/dashboard")} className="btn-ghost" style={{ fontSize: '.82rem', padding: '.45rem .9rem' }}>
                    ← Dashboard
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="white"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                    </div>
                    <h1 style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.3px' }}>Friends</h1>
                    {pending.length > 0 && (
                        <span style={{ background: '#ef4444', color: '#fff', fontSize: '.65rem', fontWeight: 800, borderRadius: 99, padding: '2px 8px' }}>{pending.length} pending</span>
                    )}
                </div>
            </header>

            <div style={{ maxWidth: 680, margin: '0 auto', padding: 'clamp(1rem, 4vw, 2rem) clamp(.75rem, 4vw, 1.5rem)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Add friend */}
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '.75rem' }}>Add Friend</p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: '1rem' }}>Enter someone's email to send a friend request.</p>
                    <form onSubmit={handleAddFriend} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="friend@example.com" className="field" style={{ minWidth: 0, flex: '1 1 200px' }} />
                        <button type="submit" disabled={addLoading || !email.trim()} className="btn-primary" style={{ flexShrink: 0, padding: '.75rem 1.25rem' }}>
                            {addLoading ? "…" : "Send"}
                        </button>
                    </form>
                    {addStatus && (
                        <p style={{ marginTop: '.75rem', fontSize: '.875rem', fontWeight: 600, color: addStatus.type === "success" ? '#4ade80' : '#f87171' }}>
                            {addStatus.msg}
                        </p>
                    )}
                </div>

                {/* Pending requests */}
                {pending.length > 0 && (
                    <div className="glass" style={{ padding: '1.5rem', borderColor: 'rgba(245,158,11,.25)' }}>
                        <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#f59e0b', marginBottom: '.75rem' }}>
                            Friend Requests <span style={{ background: 'rgba(245,158,11,.15)', borderRadius: 99, padding: '1px 8px' }}>{pending.length}</span>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                            {pending.map(req => (
                                <div key={req._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem', borderRadius: 12, background: 'var(--bg-card2)' }}>
                                    <Avatar name={req.requester.name} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, fontSize: '.9rem' }}>{req.requester.name}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '.75rem' }}>{req.requester.email}</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button onClick={() => handleRespond(req._id, "accept")}
                                            style={{ padding: '.45rem .9rem', borderRadius: 8, border: '1px solid rgba(34,197,94,.3)', background: 'rgba(34,197,94,.12)', color: '#4ade80', cursor: 'pointer', fontWeight: 700, fontSize: '.8rem' }}>
                                            ✓ Accept
                                        </button>
                                        <button onClick={() => handleRespond(req._id, "reject")}
                                            className="btn-ghost" style={{ padding: '.45rem .9rem', fontSize: '.8rem' }}>
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Sent requests */}
                {sent.length > 0 && (
                    <div className="glass" style={{ padding: '1.5rem' }}>
                        <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', marginBottom: '.75rem' }}>
                            Sent Requests <span style={{ background: 'rgba(255,255,255,.05)', borderRadius: 99, padding: '1px 8px' }}>{sent.length}</span>
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                            {sent.map(req => (
                                <div key={req._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.75rem .85rem', borderRadius: 12, background: 'var(--bg-card2)' }}>
                                    <Avatar name={req.recipient.name} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontWeight: 600, fontSize: '.875rem' }}>{req.recipient.name}</p>
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '.75rem' }}>{req.recipient.email}</p>
                                    </div>
                                    <span className="badge-pending">Pending…</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Friends list */}
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <p style={{ fontSize: '.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--accent)', marginBottom: '.75rem' }}>
                        My Friends <span style={{ background: 'rgba(99,102,241,.15)', borderRadius: 99, padding: '1px 8px' }}>{friends.length}</span>
                    </p>
                    {loading ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem' }}>Loading…</p>
                    ) : friends.length === 0 ? (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem' }}>No friends yet — send a request above 🤝</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                            {friends.map(f => {
                                const isOnline = onlineIds.has(f._id?.toString());
                                return (
                                    <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem', borderRadius: 12, background: 'var(--bg-card2)', transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#1c1e2e'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card2)'}>
                                        <div style={{ position: 'relative' }}>
                                            <Avatar name={f.name} />
                                            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: isOnline ? '#22c55e' : '#374151', border: '2px solid var(--bg-card2)' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 600, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                                            <p style={{ fontSize: '.75rem', color: isOnline ? '#4ade80' : 'var(--text-secondary)', fontWeight: 500 }}>{isOnline ? '● online' : 'offline'}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <button onClick={() => handleDM(f)} className="btn-ghost" style={{ fontSize: '.78rem', padding: '.4rem .85rem' }}>
                                                💬 Message
                                            </button>
                                            {isOnline && inRoom && (
                                                <button onClick={() => sendInvitation(f._id?.toString())}
                                                    style={{ padding: '.4rem .85rem', fontSize: '.78rem', borderRadius: 8, border: '1px solid rgba(34,197,94,.3)', background: 'rgba(34,197,94,.08)', color: '#4ade80', cursor: 'pointer', fontWeight: 600 }}>
                                                    Invite
                                                </button>
                                            )}
                                            <button onClick={() => handleRemove(f.friendshipId)}
                                                style={{ padding: '.4rem .6rem', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '1rem', borderRadius: 6, transition: 'color .15s' }}
                                                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                                                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}>
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
