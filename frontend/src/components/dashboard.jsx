import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from '../contexts/AuthContext';
import { useChat } from '../contexts/ChatContext';
import { API_BASE } from '../config/api';
import InviteToast from './InviteToast';

const Dashboard = () => {
    const navigate = useNavigate();
    const { user, logout, token } = useAuth();
    const { connect, allOnlineUsers, sendInvitation, inRoom, joinRoom } = useChat();

    const [showJoinField, setShowJoinField]   = useState(false);
    const [meetId, setMeetId]                 = useState('');
    const [friends, setFriends]               = useState([]);
    const [pendingCount, setPendingCount]     = useState(0);
    const [invitedIds, setInvitedIds]         = useState(new Set());
    const [activeTab, setActiveTab]           = useState('home'); // 'home' | 'friends'

    // ── Load friends & connect socket ──────────────────────────────────────
    useEffect(() => {
        connect();
        if (!token) return;
        const API     = API_BASE;
        const headers = { Authorization: `Bearer ${token}` };
        Promise.all([
            fetch(`${API}/friends/list`, { headers }).then(r => r.json()),
            fetch(`${API}/friends/pending`, { headers }).then(r => r.json()),
        ]).then(([fl, pl]) => {
            setFriends(fl.friends || []);
            setPendingCount((pl.requests || []).length);
        }).catch(() => {});
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [token]);

    // ── Handlers ───────────────────────────────────────────────────────────
    const handleLogout = () => {
        logout();
        navigate('/login', { replace: true });  // FIX: was missing navigate
    };

    const handleCreateMeet = () => navigate(`/meet/${uuidv4()}`);
    const handleJoinMeet   = () => { if (meetId.trim()) navigate(`/meet/${meetId.trim()}`); };

    const onlineIds = new Set(allOnlineUsers.map(u => u.userId));

    // ── Sidebar nav items ──────────────────────────────────────────────────
    const navItems = [
        { key: 'home',    label: 'Dashboard',    icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
        { key: 'friends', label: 'Friends',       icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', badge: pendingCount },
        { key: 'chat',    label: 'Live Chat',    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
    ];

    return (
        <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* ── Invitation toast (shows even when not in chat) ── */}
            <InviteToast />
            {/* ── Sidebar ── */}
            <aside className="sidebar" style={{ width: 240, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
                {/* Logo */}
                <div className="sidebar-logo" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg viewBox="0 0 24 24" width={18} height={18} fill="white"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                    </div>
                    <span style={{ fontWeight: 800, letterSpacing: '-0.5px' }}>NexCall</span>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav" style={{ flex: 1, padding: '1rem .75rem', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {navItems.map(item => (
                        <button key={item.key} className="sidebar-item"
                            onClick={() => item.key === 'chat' ? navigate('/chat') : item.key === 'friends' ? navigate('/friends') : setActiveTab('home')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '.65rem .9rem',
                                borderRadius: 10, border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                                background: activeTab === item.key ? 'rgba(99,102,241,.15)' : 'transparent',
                                color: activeTab === item.key ? 'var(--accent-hover)' : 'var(--text-secondary)',
                                fontWeight: activeTab === item.key ? 700 : 500, fontSize: '.875rem', transition: 'all .15s',
                            }}
                            onMouseEnter={e => { if (activeTab !== item.key) { e.currentTarget.style.background = 'rgba(255,255,255,.04)'; e.currentTarget.style.color = 'var(--text-primary)'; }}}
                            onMouseLeave={e => { if (activeTab !== item.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}}
                        >
                            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
                            {item.label}
                            {item.badge > 0 && (
                                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', fontSize: '.65rem', fontWeight: 800, borderRadius: 99, padding: '1px 7px' }}>{item.badge}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* User + logout */}
                <div className="sidebar-footer" style={{ padding: '1rem', borderTop: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '.75rem', borderRadius: 12, background: 'var(--bg-card2)', marginBottom: '.75rem' }}>
                        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.9rem', flexShrink: 0 }}>
                            {user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{ fontWeight: 700, fontSize: '.825rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</p>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '.7rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
                        </div>
                    </div>
                    <button onClick={handleLogout}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '.6rem .9rem', borderRadius: 10, border: '1px solid rgba(239,68,68,.25)', background: 'rgba(239,68,68,.06)', color: '#f87171', cursor: 'pointer', fontSize: '.825rem', fontWeight: 600, transition: 'all .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.06)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,.25)'; }}
                    >
                        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/></svg>
                        Sign out
                    </button>
                </div>
            </aside>

            {/* ── Main content ── */}
            <main className="main-content" style={{ flex: 1, overflow: 'auto', padding: 'clamp(1rem, 4vw, 2rem)', minWidth: 0 }}>
                {/* Header */}
                <div style={{ marginBottom: '2rem' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: '.25rem' }}>
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.75px' }}>
                        Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user?.name?.split(' ')[0]} 👋
                    </h1>
                </div>

                {/* Stats row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                    {[
                        { label: 'Friends', value: friends.length, color: '#6366f1' },
                        { label: 'Online Now', value: friends.filter(f => onlineIds.has(f._id?.toString())).length, color: '#22c55e' },
                        { label: 'Pending', value: pendingCount, color: '#f59e0b' },
                    ].map(stat => (
                        <div key={stat.label} className="glass" style={{ padding: '1.25rem' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                            <p style={{ fontSize: '2rem', fontWeight: 900, color: stat.color, marginTop: '.25rem', letterSpacing: '-1px' }}>{stat.value}</p>
                        </div>
                    ))}
                </div>

                {/* Quick actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                    {/* Create meeting */}
                    <div className="glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" width={22} height={22} fill="white"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>New Meeting</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '.8rem' }}>Start a video call instantly</p>
                            </div>
                        </div>
                        <button onClick={handleCreateMeet} className="btn-primary" style={{ padding: '.7rem' }}>
                            Create Meeting
                        </button>
                    </div>

                    {/* Join meeting */}
                    <div className="glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#059669,#34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/></svg>
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>Join Meeting</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '.8rem' }}>Enter a meeting ID to join</p>
                            </div>
                        </div>
                        {!showJoinField ? (
                            <button onClick={() => setShowJoinField(true)} className="btn-ghost" style={{ width: '100%', justifyContent: 'center', padding: '.7rem' }}>
                                Enter Meeting ID
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <input className="field" value={meetId} onChange={e => setMeetId(e.target.value)}
                                    placeholder="Paste meeting ID" onKeyDown={e => e.key === 'Enter' && handleJoinMeet()} autoFocus />
                                <button onClick={handleJoinMeet} className="btn-primary" style={{ flexShrink: 0, padding: '.7rem 1rem' }}>Join</button>
                            </div>
                        )}
                    </div>

                    {/* Open chat */}
                    <div className="glass" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1rem', borderColor: 'rgba(99,102,241,.25)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="white" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg>
                            </div>
                            <div>
                                <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 2 }}>Live Chat</h3>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '.8rem' }}>Message friends in real-time</p>
                            </div>
                        </div>
                        <button onClick={() => navigate('/chat')} className="btn-primary" style={{ padding: '.7rem', background: 'linear-gradient(135deg,#7c3aed,#a78bfa)' }}>
                            Open Chat →
                        </button>
                    </div>
                </div>

                {/* Friends list */}
                <div className="glass" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <h2 style={{ fontWeight: 700, fontSize: '1.05rem' }}>Friends</h2>
                            {pendingCount > 0 && (
                                <span style={{ background: '#ef4444', color: '#fff', fontSize: '.65rem', fontWeight: 800, borderRadius: 99, padding: '2px 8px' }}>
                                    {pendingCount} pending
                                </span>
                            )}
                        </div>
                        <button onClick={() => navigate('/friends')} className="btn-ghost" style={{ fontSize: '.78rem', padding: '.4rem .85rem' }}>
                            Manage friends →
                        </button>
                    </div>

                    {friends.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                            <p style={{ fontSize: '2rem', marginBottom: '.5rem' }}>🤝</p>
                            <p style={{ fontSize: '.875rem', marginBottom: '1rem' }}>No friends yet</p>
                            <button onClick={() => navigate('/friends')} className="btn-primary" style={{ padding: '.55rem 1.25rem', fontSize: '.825rem' }}>Add friends</button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                            {friends.map(f => {
                                const isOnline = onlineIds.has(f._id?.toString());
                                const invited  = invitedIds.has(f._id?.toString());
                                return (
                                    <div key={f._id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.85rem 1rem', borderRadius: 14, background: 'var(--bg-card2)', transition: 'background .15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#1c1e2e'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-card2)'}>
                                        {/* Avatar */}
                                        <div style={{ position: 'relative', flexShrink: 0 }}>
                                            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '.9rem' }}>
                                                {f.name[0].toUpperCase()}
                                            </div>
                                            <span style={{ position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: '50%', background: isOnline ? '#22c55e' : '#374151', border: '2px solid var(--bg-card2)' }} />
                                        </div>
                                        {/* Info */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontWeight: 600, fontSize: '.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</p>
                                            <p style={{ fontSize: '.75rem', color: isOnline ? '#4ade80' : 'var(--text-secondary)', fontWeight: 500 }}>
                                                {isOnline ? '● online' : 'offline'}
                                            </p>
                                        </div>
                                        {/* Actions */}
                                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                            <button onClick={() => { const ids = [user._id, f._id.toString()].sort(); joinRoom(`dm_${ids[0]}_${ids[1]}`, user.name, f.name); navigate('/chat'); }}
                                                className="btn-ghost" style={{ padding: '.4rem .85rem', fontSize: '.78rem' }}>
                                                💬 DM
                                            </button>
                                            {isOnline && inRoom && (
                                                <button onClick={() => { sendInvitation(f._id?.toString()); setInvitedIds(p => new Set([...p, f._id?.toString()])); }}
                                                    disabled={invited}
                                                    style={{ padding: '.4rem .85rem', fontSize: '.78rem', borderRadius: 8, border: '1px solid rgba(34,197,94,.3)', background: invited ? 'rgba(34,197,94,.06)' : 'rgba(34,197,94,.12)', color: '#4ade80', cursor: invited ? 'default' : 'pointer', opacity: invited ? .5 : 1, fontWeight: 600 }}>
                                                    {invited ? 'Invited ✓' : 'Invite'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
