import React from 'react';

/**
 * NEXUS Orchestrator Component
 * Visualizes hub-and-spoke consolidation opportunities.
 */
export default function NEXUSOrchestrator({ handovers, onSync, onDeployOverflow }) {
    if (!handovers || handovers.length === 0) return null;

    return (
        <div className="nexus-orchestrator glass animate-slide-in">
            <div className="nexus-header">
                <div className="nexus-title">
                    <span className="nexus-logo">⛓️</span>
                    <div>
                        <h4>NEXUS Orchestration</h4>
                        <p>Intelligent Hub-Link Found</p>
                    </div>
                </div>
                <div className="nexus-badge">BETA</div>
            </div>

            <div className="nexus-chain-list">
                {handovers.map((h, i) => (
                    <div key={i} className="nexus-chain-card">
                        <div className="nexus-visual-path">
                            <div className="path-node">
                                <span className="node-icon">🏠</span>
                                <span className="node-label">Origin</span>
                            </div>
                            <div className="path-line">
                                <span className="nexus-pulse"></span>
                            </div>
                            <div className="path-node highlight">
                                <span className="node-icon">📍</span>
                                <span className="node-label">{h.hubLocation}</span>
                                <div className="handover-label">HANDOVER HUB</div>
                            </div>
                            <div className="path-line dashed"></div>
                            <div className="path-node">
                                <span className="node-icon">🏁</span>
                                <span className="node-label">End</span>
                            </div>
                        </div>

                        <div className="nexus-details">
                            <div className="nexus-info-bit">
                                <span className="info-label">SUPPLIER LINK</span>
                                <span className="info-val">{h.vehicleName}</span>
                            </div>
                            <div className="nexus-info-bit">
                                <span className="info-label">TIME GAP</span>
                                <span className="info-val" style={{ color: h.timeGap > 2 ? '#ff5252' : '#00e676' }}>
                                    {h.timeGap}h
                                </span>
                            </div>
                            <div className="nexus-info-bit">
                                <span className="info-label">TOTAL LOAD</span>
                                <span className="info-val">{h.totalLoad}T</span>
                            </div>
                        </div>

                        {h.needsOverflow && (
                            <div className="nexus-overflow-alert animate-pulse">
                                <div className="alert-content">
                                    <span className="alert-icon">⚠️</span>
                                    <div className="alert-text">
                                        <strong>CAPACITY EXCEEDED</strong>
                                        <p>Max 20T per vehicle. Deploying overflow vehicle for <strong>{h.overflowWeight}T</strong>.</p>
                                    </div>
                                </div>
                                <button className="overflow-deploy-btn" onClick={() => onDeployOverflow(h)}>
                                    Deploy Overflow Asset 🚛
                                </button>
                            </div>
                        )}

                        <div className="nexus-actions">
                            <button className="nexus-sync-btn" onClick={() => onSync(h)}>
                                🧬 Synchronize Logistics
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="nexus-footer">
                <p>NEXUS identifies intermediate coordination points to minimize fleet deadheading.</p>
            </div>
        </div>
    );
}
