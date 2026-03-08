import React from 'react';
import './IntelligenceOverlay.css';

export default function IntelligenceOverlay() {
    return (
        <div className="intelligence-overlay">
            <div className="overlay-header">
                <span className="overlay-icon">🧠</span>
                <div className="overlay-title-group">
                    <span className="overlay-title">AI COMMAND CENTER</span>
                    <span className="overlay-sub">Scanning 342 active lanes</span>
                </div>
            </div>
            <div className="overlay-actions">
                <button className="overlay-btn" title="Quick Dispatch">
                    <span>⚡</span>
                    <label>MAGIC DISPATCH</label>
                </button>
                <button className="overlay-btn" title="ESG Summary">
                    <span>📊</span>
                    <label>ESG REPORT</label>
                </button>
            </div>
        </div>
    );
}
