import React, { useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

export default function Login({ onLoginComplete }) {
    const [isRegistering, setIsRegistering] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

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
            <div className="glass login-card animate-slide-in">
                <span className="login-logo" style={{ fontSize: '4rem', display: 'block', marginBottom: '16px' }}>🌍</span>
                <h1 style={{ margin: '0 0 8px 0', fontSize: '2.4rem', color: '#00e676', letterSpacing: '1px' }}>EcoRoute</h1>
                <p style={{ margin: '0 0 24px 0', color: 'rgba(255,255,255,0.7)', fontSize: '1rem' }}>
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

                <div style={{ marginTop: '36px', fontSize: '0.8rem', color: 'rgba(0, 230, 118, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    🔒 Secured by Firebase Intelligence
                </div>
            </div>
        </div>
    );
}
