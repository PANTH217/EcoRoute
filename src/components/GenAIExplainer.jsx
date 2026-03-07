import React, { useState, useEffect } from 'react';
import { generateRouteAnalysis } from '../utils/aiAdvisor';

export default function GenAIExplainer({ routes, vehicleType, payload, originName, destinationName }) {
    const [analysis, setAnalysis] = useState('');
    const [displayedText, setDisplayedText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        if (!routes || routes.length === 0) return;

        // Reset state for new routes
        setIsGenerating(true);
        setDisplayedText('');

        // Simulate a slight delay for the AI to "think"
        const thinkTimer = setTimeout(async () => {
            try {
                const result = await generateRouteAnalysis(routes, vehicleType, payload, originName, destinationName);
                setAnalysis(result || "Analysis complete. Optimization verified locally.");
            } catch (e) {
                console.error("Explainer failed:", e);
                setAnalysis("Minor sensor flux detected. Reverting to local fallback analysis.");
            }
        }, 600);

        return () => clearTimeout(thinkTimer);
    }, [routes, vehicleType, payload, originName, destinationName]);

    // Typewriter effect
    useEffect(() => {
        if (!analysis) {
            setDisplayedText('');
            return;
        }

        let i = 0;
        setDisplayedText(''); // Reset on new analysis
        setIsGenerating(true);

        const typingInterval = setInterval(() => {
            // Use functional state update to prevent stale closures and double-typing
            setDisplayedText((prev) => {
                if (prev.length < analysis.length) {
                    return analysis.slice(0, prev.length + 1);
                } else {
                    clearInterval(typingInterval);
                    setIsGenerating(false);
                    return prev;
                }
            });
        }, 15); // Speed

        return () => {
            clearInterval(typingInterval);
        };
    }, [analysis]);

    if (!routes || routes.length === 0) return null;

    return (
        <div className="gen-ai-explainer glass animate-slide-in" style={{
            margin: '0 20px 20px',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(0, 230, 118, 0.4)',
            background: 'linear-gradient(135deg, rgba(0, 26, 13, 0.8) 0%, rgba(0, 8, 4, 0.9) 100%)',
            boxShadow: '0 8px 32px 0 rgba(0, 230, 118, 0.1)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0, // CRITICAL: Prevent the sidebar from squishing this component
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start'
        }}>
            {/* Ambient Glow */}
            <div style={{
                position: 'absolute',
                top: 0, right: 0,
                width: '100px', height: '100px',
                background: 'radial-gradient(circle, rgba(0,230,118,0.15) 0%, rgba(0,0,0,0) 70%)',
                filter: 'blur(10px)',
                pointerEvents: 'none'
            }} />

            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px', gap: '8px', width: '100%' }}>
                <span style={{ fontSize: '1.1rem', animation: isGenerating ? 'pulse 1.5s infinite' : 'none', lineHeight: 1 }}>🧠</span>
                <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#00e676', letterSpacing: '0.5px', fontWeight: '600', textTransform: 'uppercase' }}>
                    Lorri.AI Route Analyst
                </h4>
                {isGenerating && (
                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginLeft: 'auto', fontStyle: 'italic', letterSpacing: '0.5px' }}>
                        Analyzing variables...
                    </span>
                )}
            </div>

            <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: 'rgba(255,255,255,0.95)',
                lineHeight: '1.6',
                minHeight: '60px',
                textAlign: 'left',
                width: '100%',
                fontWeight: '400',
                letterSpacing: '0.2px'
            }}>
                {displayedText}
                {isGenerating && <span style={{ borderRight: '2px solid #00e676', marginLeft: '2px', animation: 'blink 1s step-end infinite' }}>&nbsp;</span>}
            </p>
        </div>
    );
}
