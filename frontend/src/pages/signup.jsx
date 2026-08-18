import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import server_api from "../config/api";

const Signup = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { login } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError]     = useState("");
    const [formData, setFormData] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });

    const from = location.state?.from || "/dashboard";

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        if (formData.password !== formData.confirmPassword) { setError("Passwords do not match."); return; }
        if (formData.password.length < 6) { setError("Password must be at least 6 characters."); return; }
        setLoading(true);
        try {
            const res    = await fetch(`${server_api}/api/v1/users/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: formData.fullName, email: formData.email, password: formData.password }),
            });
            const result = await res.json();
            if (res.ok) {
                login(result.token, result.user);
                navigate(from, { replace: true });
            } else {
                setError(result.message || "Signup failed. Please try again.");
            }
        } catch {
            setError("Server error — please try again later.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(.75rem, 4vw, 2rem)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'fixed', top: '-15%', left: '-8%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(139,92,246,.2) 0%,transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'fixed', bottom: '-15%', right: '-8%', width: '55vw', height: '55vw', borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,.15) 0%,transparent 70%)', pointerEvents: 'none' }} />

            <div className="glass anim-fade-up" style={{ width: '100%', maxWidth: 460, padding: 'clamp(1.25rem, 6vw, 2.5rem)', position: 'relative', zIndex: 1 }}>
                <button onClick={() => navigate("/")} className="btn-ghost" style={{ marginBottom: '1.75rem', fontSize: '.8rem' }}>
                    ← Back to home
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg viewBox="0 0 24 24" width={22} height={22} fill="white"><path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14v-4zM3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/></svg>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '-0.5px' }}>NexCall</span>
                </div>

                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.75px', marginBottom: '.5rem' }}>Create your account</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '.875rem', marginBottom: '2rem' }}>Join NexCall and start connecting today</p>

                {error && (
                    <div style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '.75rem 1rem', marginBottom: '1.25rem', color: '#f87171', fontSize: '.875rem', fontWeight: 500 }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Full Name</label>
                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} required
                            className="field" placeholder="Jane Doe" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Email</label>
                        <input type="email" name="email" value={formData.email} onChange={handleChange} required
                            className="field" placeholder="you@example.com" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Password</label>
                        <input type="password" name="password" value={formData.password} onChange={handleChange} required
                            className="field" placeholder="At least 6 characters" />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '.5rem', textTransform: 'uppercase', letterSpacing: '.5px' }}>Confirm Password</label>
                        <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required
                            className="field" placeholder="••••••••" />
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary" style={{ marginTop: '.5rem', padding: '.85rem', fontSize: '.95rem' }}>
                        {loading ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <svg style={{ animation: 'spin .8s linear infinite' }} width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3}><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/></svg>
                                Creating account…
                            </span>
                        ) : "Create account →"}
                    </button>
                </form>

                <hr className="divider" />

                <p style={{ textAlign: 'center', fontSize: '.875rem', color: 'var(--text-secondary)' }}>
                    Already have an account?{" "}
                    <button onClick={() => navigate("/login")} style={{ background: 'none', border: 'none', color: 'var(--accent-hover)', fontWeight: 700, cursor: 'pointer', fontSize: '.875rem' }}>
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
};

export default Signup;
