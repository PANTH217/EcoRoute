import React, { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css';
import { SAMPLE_FLEET, SAMPLE_TRIPS } from '../utils/sampleData';

export default function Login({ onLoginComplete }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        carbonSaved: 0,
        efficiency: 0,
        tripsCount: 0
    });

    useEffect(() => {
        try {
            const savedTrips = localStorage.getItem('ecoroute_trips');
            const savedFleet = localStorage.getItem('ecoroute_fleet');

            const trips = (savedTrips && JSON.parse(savedTrips).length > 0) ? JSON.parse(savedTrips) : SAMPLE_TRIPS;
            const fleet = savedFleet ? JSON.parse(savedFleet) : SAMPLE_FLEET;

            if (trips) {
                const totalSaved = trips.reduce((acc, t) => acc + (t.savingCo2 || 0), 0);
                const fleetCount = fleet.length;

                setStats({
                    carbonSaved: totalSaved.toFixed(1),
                    efficiency: trips.length > 0 ? 98.4 : 0,
                    tripsCount: trips.length,
                    fleetCount: fleetCount
                });
            }
        } catch (err) {
            console.error("Failed to load local stats:", err);
            // Even on error, show samples
            setStats({
                carbonSaved: 512.4, // Generic total from sample
                efficiency: 98.4,
                tripsCount: 3
            });
        }
    }, []);

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
        <div className="login-container">
            <div className="login-content-wrapper animate-fade-in">
                <div className="informative-panel">
                    <div className="status-pill animate-pulse">
                        <span className="pulse-dot"></span> SYSTEM ONLINE: NEXUS CORE ACTIVE
                    </div>

                    <h2 className="hero-title">Decarbonizing <br /><span className="gradient-text">Global Logistics</span></h2>
                    <p className="hero-subtitle">
                        The world's first AI-driven orchestration protocol for sustainable enterprise supply chains.
                        {stats.tripsCount > 0 ? " You've already made an impact." : " Join the protocol and minimize your footprint."}
                    </p>

                    <div className="stats-grid">
                        <div className="stat-card">
                            <span className="stat-value">{stats.carbonSaved}kg</span>
                            <span className="stat-label">Total CO2 Saved</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{stats.tripsCount}</span>
                            <span className="stat-label">Verified Trips</span>
                        </div>
                        <div className="stat-card">
                            <span className="stat-value">{stats.efficiency > 0 ? stats.efficiency + '%' : 'READY'}</span>
                            <span className="stat-label">Fleet Efficiency</span>
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
