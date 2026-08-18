import React from 'react';
import { useChat } from '../contexts/ChatContext';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * InviteToast
 *
 * Renders floating toast notifications for:
 *  - incoming room invitations  (pendingInvite)
 *  - invitation status feedback (inviteNotification)
 *
 * Works on ANY page (Dashboard, ChatPage, etc.) as long as it is rendered
 * inside <ChatProvider>.
 *
 * When the user accepts an invitation while on the Dashboard, they are
 * automatically taken to the Chat page.
 */
const InviteToast = () => {
    const { pendingInvite, inviteNotification, acceptInvitation, rejectInvitation } = useChat();
    const navigate = useNavigate();

    if (!pendingInvite && !inviteNotification) return null;

    const handleAccept = () => {
        acceptInvitation(pendingInvite.inviteId);
        // Navigate to the chat page so the user lands in the room
        navigate('/chat');
    };

    return (
        <div style={{
            position: 'fixed',
            top: 20,
            right: 20,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            maxWidth: 360,
            fontFamily: 'Inter, sans-serif',
        }}>
            {/* ── Incoming room invitation ── */}
            {pendingInvite && (
                <div style={{
                    background: '#111827',
                    border: '1px solid rgba(139,92,246,.6)',
                    borderRadius: 18,
                    padding: '1rem 1.1rem',
                    boxShadow: '0 24px 56px rgba(0,0,0,.6), 0 0 0 1px rgba(139,92,246,.15)',
                    animation: 'inviteSlideIn .3s ease-out',
                }}>
                    <style>{`
                        @keyframes inviteSlideIn {
                            from { transform: translateX(110%); opacity: 0; }
                            to   { transform: translateX(0);   opacity: 1; }
                        }
                    `}</style>

                    <p style={{ fontSize: '.8rem', fontWeight: 700, color: '#c4b5fd', marginBottom: 4 }}>
                        🎉 Room Invitation
                    </p>
                    <p style={{ fontSize: '.82rem', color: '#d1d5db', marginBottom: 12, lineHeight: 1.45 }}>
                        <span style={{ color: '#fff', fontWeight: 700 }}>{pendingInvite.fromName}</span>
                        {' '}invited you to{' '}
                        <span style={{ color: '#a78bfa', fontWeight: 700 }}>#{pendingInvite.roomId}</span>
                    </p>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={handleAccept}
                            style={{
                                flex: 1, background: '#16a34a', color: '#fff',
                                border: 'none', borderRadius: 10, padding: '.45rem 0',
                                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'background .15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#15803d'}
                            onMouseLeave={e => e.currentTarget.style.background = '#16a34a'}
                        >
                            ✓ Accept
                        </button>
                        <button
                            onClick={() => rejectInvitation(pendingInvite.inviteId)}
                            style={{
                                flex: 1, background: '#374151', color: '#e5e7eb',
                                border: 'none', borderRadius: 10, padding: '.45rem 0',
                                fontSize: '.78rem', fontWeight: 700, cursor: 'pointer', transition: 'background .15s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#4b5563'}
                            onMouseLeave={e => e.currentTarget.style.background = '#374151'}
                        >
                            ✕ Decline
                        </button>
                    </div>
                </div>
            )}

            {/* ── Feedback toast (success / error) ── */}
            {inviteNotification && (
                <div style={{
                    borderRadius: 14,
                    padding: '.75rem 1rem',
                    fontSize: '.82rem',
                    fontWeight: 600,
                    animation: 'inviteSlideIn .3s ease-out',
                    ...(inviteNotification.type === 'success'
                        ? { background: 'rgba(20,83,45,.85)',  border: '1px solid rgba(34,197,94,.4)',  color: '#86efac' }
                        : { background: 'rgba(127,29,29,.85)', border: '1px solid rgba(239,68,68,.4)',  color: '#fca5a5' }
                    ),
                }}>
                    {inviteNotification.message}
                </div>
            )}
        </div>
    );
};

export default InviteToast;
