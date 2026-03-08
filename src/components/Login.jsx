import React, { useState, useEffect, useRef } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

const PROTOCOL_MESSAGES = [
    "Initializing NEXUS Core orchestration...",
    "Scanning Pune-Mumbai logistics corridor...",
    "Analyzing fleet emissions (342.5kg CO2 detected)...",
    "Optimizing payload for NEXUS-Alpha...",
    "Strategic alignment: +18% fuel efficiency identified.",
    "Lorri.AI: Recalibrating dynamic ESG layers...",
    "Syncing with global carbon offset protocol...",
    "System status: NEXUS CORE ACTIVE & STABLE."
];

export default function Login({ onLoginComplete }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);
    const [glowPos, setGlowPos] = useState({ x: 50, y: 50 });
    const terminalRef = useRef(null);

    useEffect(() => {
        let index = 0;
        const interval = setInterval(() => {
            setLogs(prev => {
                const newLogs = [...prev, PROTOCOL_MESSAGES[index]];
                return newLogs.slice(-5); // Keep last 5 logs
            });
            index = (index + 1) % PROTOCOL_MESSAGES.length;
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setGlowPos({ x, y });
    };

    const handleGoogleSignIn = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            onLoginComplete(result.user);
        } catch (error) {
            console.error("Login failed:", error);
            alert(`Authentication Failed: ${error.message}`);
        }
    };

    const handleEmailAuth = async (e) => {
        e.preventDefault();
        if (!email || !password) return alert("Please enter both email and password.");
        if (password.length < 6) return alert("Password must be at least 6 characters long.");

        setLoading(true);
        try {
            if (isRegistering) {
                const result = await createUserWithEmailAndPassword(auth, email, password);
                onLoginComplete(result.user);
            } else {
                const result = await signInWithEmailAndPassword(auth, email, password);
                onLoginComplete(result.user);
            }
        } catch (error) {
            console.error("Auth Error:", error);
            // Translate common Firebase errors into user-friendly alerts
            let msg = error.message;
            if (error.code === 'auth/invalid-credential') msg = "Incorrect email or password.";
            if (error.code === 'auth/email-already-in-use') msg = "An account with this email already exists. Try clicking 'Log In' instead.";
            alert(`Authentication Error: ${msg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="login-container"
            onMouseMove={handleMouseMove}
            style={{
                '--mouse-x': `${glowPos.x}%`,
                '--mouse-y': `${glowPos.y}%`
            }}
        >
            <div className="login-content-wrapper animate-fade-in">
                <div className="informative-panel">
                    <div className="status-pill animate-pulse">
                        <span className="pulse-dot"></span> SYSTEM ONLINE: NEXUS CORE ACTIVE
                    </div>

                    <h2 className="hero-title">Decarbonizing <br /><span className="gradient-text">Global Logistics</span></h2>
                    <p className="hero-subtitle">
                        The world's first AI-driven orchestration protocol for sustainable enterprise supply chains.
                    </p>

                    <div className="protocol-terminal">
                        <div className="terminal-header">
                            <span className="terminal-dot red"></span>
                            <span className="terminal-dot yellow"></span>
                            <span className="terminal-dot green"></span>
                            <span className="terminal-title">NEXUS_FEED.sh</span>
                        </div>
                        <div className="terminal-body" ref={terminalRef}>
                            {logs.map((log, i) => (
                                <div key={i} className="log-entry">
                                    <span className="log-prompt">$</span> {log}
                                </div>
                            ))}
                            <div className="log-cursor">_</div>
                        </div>
                    </div>

                    <div className="feature-list">
                        <div className="feature-item">
                            <span className="feature-icon">⚡</span>
                            <div>
                                <h4>Real-time Optimization</h4>
                                <p>Dynamic rerouting based on live emissions and traffic data.</p>
                            </div>
                        </div>
                        <div className="feature-item">
                            <span className="feature-icon">🛡️</span>
                            <div>
                                <h4>Enterprise Transparency</h4>
                                <p>Immutable carbon reporting for ESG compliance.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="glass login-card">
                    <span className="login-logo" style={{ fontSize: '3rem', display: 'block', marginBottom: '8px' }}>🌍</span>
                    <h1 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#00e676', letterSpacing: '1px' }}>EcoRoute</h1>
                    <p style={{ margin: '0 0 20px 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                        Enterprise NEXUS Orchestration Protocol
                    </p>

                    <form className="login-form" onSubmit={handleEmailAuth}>
                        <input
                            type="email"
                            className="login-input"
                            placeholder="Email Address"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                        <input
                            type="password"
                            className="login-input"
                            placeholder="Password (min 6 characters)"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button type="submit" className="primary-btn hover-glow" disabled={loading}>
                            {loading ? 'Authenticating...' : (isRegistering ? 'Create Secure Account' : 'Initialize Session')}
                        </button>

                        <button type="button" className="toggle-mode" onClick={() => setIsRegistering(!isRegistering)}>
                            {isRegistering ? "Already have an account? Log In" : "Need an account? Register Here"}
                        </button>
                    </form>

                    <div className="divider-container">OR</div>

                    <button className="google-btn hover-glow" onClick={handleGoogleSignIn}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" style={{ width: '24px' }} />
                        {isRegistering ? 'Sign up with Google' : 'Sign in with Google'}
                    </button>

                    <div style={{ marginTop: '24px', fontSize: '0.75rem', color: 'rgba(0, 230, 118, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        🔒 Secured by Firebase Intelligence
                    </div>
                </div>
            </div>
        </div>
    );
}
