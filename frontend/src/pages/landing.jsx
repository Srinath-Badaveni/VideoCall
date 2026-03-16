import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', color: 'var(--text-primary)', fontFamily: 'Inter, sans-serif' }}>
      {/* ── Ambient blobs ── */}
      <div style={{ position: 'fixed', top: '-10%', left: '-5%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,.18) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />
      <div style={{ position: 'fixed', bottom: '-14%', right: '-8%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,.14) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* ── Header ── */}
        <header style={{ padding: '1.25rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 50, background: 'rgba(8,9,13,.8)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="white"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.5px' }}>NexCall</span>
          </div>

          {/* Desktop nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '2rem' }} className="desktop-nav">
            <a href="#features" className="nav-link">Features</a>
            <a href="#how" className="nav-link">How it works</a>
            <button onClick={() => navigate('/login')} className="btn-ghost">Sign in</button>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ padding: '.55rem 1.25rem' }}>Get started →</button>
          </nav>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', display: 'none' }} className="mobile-menu-btn">
            <svg viewBox="0 0 24 24" width={24} height={24} fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
            </svg>
          </button>
        </header>

        {/* Mobile menu */}
        {menuOpen && (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, margin: '0 1rem', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <a href="#features" className="nav-link" onClick={() => setMenuOpen(false)}>Features</a>
            <a href="#how" className="nav-link" onClick={() => setMenuOpen(false)}>How it works</a>
            <button onClick={() => { setMenuOpen(false); navigate('/login'); }} className="btn-ghost" style={{ width: '100%' }}>Sign in</button>
            <button onClick={() => { setMenuOpen(false); navigate('/signup'); }} className="btn-primary" style={{ width: '100%' }}>Get started →</button>
          </div>
        )}

        {/* ── Hero ── */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '6rem 2rem 4rem', textAlign: 'center' }} className="anim-fade-up">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,.12)', border: '1px solid rgba(99,102,241,.3)', borderRadius: 99, padding: '4px 16px', fontSize: '.78rem', fontWeight: 700, color: '#818cf8', marginBottom: '1.5rem', letterSpacing: '.5px' }}>
            ✦ NEXT-GEN VIDEO CALLING
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 900, lineHeight: 1.08, letterSpacing: '-2px', marginBottom: '1.5rem' }}>
            Connect Instantly.<br />
            <span style={{ background: 'linear-gradient(135deg, #6366f1, #a78bfa, #c084fc)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              No limits, no latency.
            </span>
          </h1>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', maxWidth: 540, margin: '0 auto 2.5rem', lineHeight: 1.7 }}>
            HD video calls, real-time messaging, and private rooms — all in one beautifully designed platform.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ fontSize: '1rem', padding: '.85rem 2rem' }}>
              Start for free →
            </button>
            <button onClick={() => navigate('/login')} className="btn-ghost" style={{ fontSize: '1rem', padding: '.85rem 2rem' }}>
              Sign in
            </button>
          </div>
        </section>

        {/* ── Feature cards ── */}
        <section id="features" style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 2rem' }}>
          <p style={{ textAlign: 'center', fontSize: '.78rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent)', marginBottom: '1rem' }}>FEATURES</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '3rem', letterSpacing: '-1px' }}>Everything you need to connect</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            {[
              { icon: '📹', title: 'HD Video Calls', desc: 'Crystal-clear 1080p video with adaptive bitrate for any connection speed.' },
              { icon: '💬', title: 'Live Chat Rooms', desc: 'Real-time WebSocket-powered chat with private rooms and DMs.' },
              { icon: '🔐', title: '3-Hour Sessions', desc: 'Secure, session-based authentication that auto-logs you out for safety.' },
              { icon: '🔔', title: 'Push Notifications', desc: 'Get notified in your browser when a friend messages — even in other tabs.' },
              { icon: '👥', title: 'Friends & Invites', desc: 'Add friends by email, see who\'s online, invite them to rooms instantly.' },
              { icon: '⚡', title: 'Zero Setup', desc: 'No downloads. Create a room and share the link — start calling in seconds.' },
            ].map((f, i) => (
              <div key={i} className="glass" style={{ padding: '1.75rem', transition: 'transform .2s,border-color .2s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,.4)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}>
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>{f.icon}</div>
                <h3 style={{ fontWeight: 700, marginBottom: '.5rem', fontSize: '1rem' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" style={{ maxWidth: 800, margin: '0 auto', padding: '4rem 2rem' }}>
          <p style={{ textAlign: 'center', fontSize: '.78rem', fontWeight: 700, letterSpacing: '2px', color: 'var(--accent)', marginBottom: '1rem' }}>HOW IT WORKS</p>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(1.8rem, 3vw, 2.5rem)', fontWeight: 800, marginBottom: '3rem', letterSpacing: '-1px' }}>Up and running in 3 steps</h2>
          {[
            { step: '01', title: 'Create your account', desc: 'Sign up with your email — takes under 30 seconds.' },
            { step: '02', title: 'Add your friends', desc: 'Search by email and send a friend request.' },
            { step: '03', title: 'Call or chat', desc: 'Start a video meeting or open a private chat room.' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '1.5rem', marginBottom: '2rem', alignItems: 'flex-start' }}>
              <div style={{ minWidth: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,rgba(99,102,241,.18),rgba(139,92,246,.12))', border: '1px solid rgba(99,102,241,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>{s.step}</div>
              <div>
                <h3 style={{ fontWeight: 700, marginBottom: '.25rem' }}>{s.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', lineHeight: 1.6 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── CTA ── */}
        <section style={{ textAlign: 'center', padding: '4rem 2rem 6rem' }}>
          <div className="glass" style={{ maxWidth: 600, margin: '0 auto', padding: '3rem 2rem' }}>
            <h2 style={{ fontWeight: 800, fontSize: '2rem', marginBottom: '1rem', letterSpacing: '-1px' }}>Ready to connect?</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Join thousands already using NexCall.</p>
            <button onClick={() => navigate('/signup')} className="btn-primary" style={{ fontSize: '1rem', padding: '.85rem 2.5rem' }}>
              Create free account →
            </button>
          </div>
        </section>
      </div>

      <style>{`
        @media(max-width:768px){
          .desktop-nav{display:none!important;}
          .mobile-menu-btn{display:block!important;}
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
