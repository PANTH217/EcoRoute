import React, { useState, useEffect } from 'react';
import './GlobalIntelligenceBar.css';

export default function GlobalIntelligenceBar({ trips }) {
    const [emissionIndex, setEmissionIndex] = useState(42.5);
    const [activeNodes, setActiveNodes] = useState(128);

    useEffect(() => {
        const interval = setInterval(() => {
            // Simulate slight fluctuations in real-time metrics
            setEmissionIndex(prev => +(prev + (Math.random() * 0.4 - 0.2)).toFixed(1));
            setActiveNodes(prev => prev + (Math.random() > 0.5 ? 1 : -1));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    const totalSaved = trips.reduce((acc, t) => acc + (t.savingCo2 || 0), 0).toFixed(1);

    return (
        <div className="global-intelligence-bar">
            <div className="intelligence-node">
                <span className="node-label">FLEET EMISSION INDEX</span>
                <span className="node-value green">{emissionIndex}% <span className="trend-arrow">↓</span></span>
            </div>
            <div className="intelligence-separator"></div>
            <div className="intelligence-node">
                <span className="node-label">ACTIVE OPTIMIZATION NODES</span>
                <span className="node-value">{activeNodes}</span>
            </div>
            <div className="intelligence-separator"></div>
            <div className="intelligence-node">
                <span className="node-label">SYSTEM CARBON OFFSET</span>
                <span className="node-value blue">{totalSaved}kg</span>
            </div>
            <div className="intelligence-status">
                <span className="status-dot green"></span>
                <span className="status-text">LORRI.AI: OPERATIONAL</span>
            </div>
        </div>
    );
}
