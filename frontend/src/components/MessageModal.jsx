import React, { useState, useEffect } from 'react';

const MessageModal = () => {
    const [message, setMessage] = useState('');
    const [type,    setType]    = useState('success');
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            const { msg, msgType } = e.detail;
            setMessage(msg);
            setType(msgType);
            setVisible(true);
            setTimeout(() => setVisible(false), 4000);
        };
        window.addEventListener('showMessage', handler);
        return () => window.removeEventListener('showMessage', handler);
    }, []);

    if (!visible) return null;

    const isSuccess = type === 'success';

    return (
        <div style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            maxWidth: 380, width: 'calc(100vw - 48px)',
            background: isSuccess ? 'rgba(15,23,20,.95)' : 'rgba(23,15,15,.95)',
            border: `1px solid ${isSuccess ? 'rgba(34,197,94,.4)' : 'rgba(239,68,68,.4)'}`,
            borderLeft: `4px solid ${isSuccess ? '#22c55e' : '#ef4444'}`,
            borderRadius: 14,
            padding: '1rem 1.25rem',
            display: 'flex', alignItems: 'flex-start', gap: 12,
            backdropFilter: 'blur(16px)',
            boxShadow: isSuccess
                ? '0 8px 32px rgba(34,197,94,.12)'
                : '0 8px 32px rgba(239,68,68,.12)',
            animation: 'slideInR .3s cubic-bezier(.22,1,.36,1)',
            fontFamily: 'Inter, sans-serif',
        }}>
            <div style={{ flexShrink: 0, marginTop: 1 }}>
                {isSuccess ? (
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                ) : (
                    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                )}
            </div>
            <p style={{ flex: 1, fontSize: '.875rem', fontWeight: 600, color: isSuccess ? '#86efac' : '#fca5a5', lineHeight: 1.5 }}>
                {message}
            </p>
            <button onClick={() => setVisible(false)}
                style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', color: isSuccess ? 'rgba(134,239,172,.6)' : 'rgba(252,165,165,.6)', fontSize: '1.1rem', lineHeight: 1, padding: 0, marginTop: 1 }}>
                ✕
            </button>
        </div>
    );
};

export default MessageModal;
