import { useState, useMemo } from 'react';

// Simulate a real Indian freight marketplace
const CARGO_TYPES = [
    { type: 'FMCG', icon: '🛒', desc: 'Fast-moving consumer goods' },
    { type: 'Auto Parts', icon: '⚙️', desc: 'Engine components' },
    { type: 'Agri Produce', icon: '🌾', desc: 'Grains & vegetables' },
    { type: 'Pharmaceuticals', icon: '💊', desc: 'Cold-chain medicines' },
    { type: 'Textiles', icon: '🧵', desc: 'Fabric & garments' },
    { type: 'Electronics', icon: '📦', desc: 'Consumer electronics' },
    { type: 'Construction', icon: '🧱', desc: 'Steel & cement supplies' },
    { type: 'Chemical', icon: '⚗️', desc: 'Industrial chemicals' },
];

function generateMatches(origin, destination, vehicleName) {
    const seed = (origin?.[0] || 18.5) * 1000; // reproducible per route
    const count = 4;
    return Array.from({ length: count }, (_, i) => {
        const cargo = CARGO_TYPES[(Math.floor(seed + i * 17) % CARGO_TYPES.length)];
        const weightT = parseFloat(((seed * (i + 1)) % 12 + 4).toFixed(1));
        const distKm = Math.floor(((seed + i * 53) % 180) + 80);
        const ratePerKm = Math.floor(((seed + i * 23) % 30) + 18); // ₹18–₹48/km
        const payout = distKm * ratePerKm;
        const urgency = i === 0 ? 'URGENT' : i === 1 ? 'TODAY' : 'FLEXIBLE';
        const urgencyColor = i === 0 ? 'urgency-urgent' : i === 1 ? 'urgency-today' : 'urgency-flex';
        return {
            id: i + 1,
            cargo,
            weightT,
            distKm,
            payout,
            urgency,
            urgencyColor,
            shipper: `Shipper ${String.fromCharCode(65 + i)}`,
        };
    });
}

export default function BackhaulAlert({ trip, vehicleName, onAccept, onDismiss }) {
    const [selectedId, setSelectedId] = useState(null);
    const [accepted, setAccepted] = useState(false);

    const returnOrigin = trip?.destinationName || 'Destination';
    const returnDest = trip?.originName || 'Origin';

    const matches = useMemo(
        () => generateMatches(trip?.destPos, trip?.originPos, vehicleName),
        [trip]
    );

    const handleAccept = (match) => {
        setSelectedId(match.id);
        setAccepted(true);
        setTimeout(() => {
            onAccept?.({ match, returnOrigin, returnDest, vehicleName });
        }, 1200);
    };

    return (
        <div className="bh-overlay">
            <div className="bh-modal glass">
                {/* Header */}
                <div className="bh-header">
                    <div className="bh-badge">🔄 BACKHAUL OPTIMIZER</div>
                    <button className="bh-close" onClick={onDismiss}>✕</button>
                </div>

                <h2 className="bh-title">Your Truck Returns Empty!</h2>
                <p className="bh-desc">
                    <strong>{vehicleName || 'Your truck'}</strong> is heading back
                    <span className="bh-route"> {returnOrigin} → {returnDest}</span> with no load.
                    Every empty km costs you money and emits CO₂ for nothing.
                </p>

                <div className="bh-info-banner">
                    <span className="bh-info-icon">💡</span>
                    <p><strong>Note:</strong> Return trip parameters (cargo type, weight, and destination) are fully customizable by warehouse managers across different logistical nodes to maximize asset utilization.</p>
                </div>

                {/* Return route summary */}
                <div className="bh-route-bar">
                    <div className="bh-route-point origin">
                        <span className="bh-dot red" />
                        {returnOrigin}
                    </div>
                    <div className="bh-route-line">
                        <div className="bh-truck-animation">🚛</div>
                    </div>
                    <div className="bh-route-point dest">
                        <span className="bh-dot green" />
                        {returnDest}
                    </div>
                </div>

                <div className="bh-section-title">
                    📦 Available Loads on This Route
                    <span className="bh-count">{matches.length} matches</span>
                </div>

                {accepted ? (
                    <div className="bh-confirmed">
                        <span className="bh-confirmed-icon">✅</span>
                        <div>
                            <strong>Load Accepted!</strong>
                            <p>Your backhaul cargo has been booked. No empty miles on this run!</p>
                        </div>
                    </div>
                ) : (
                    <div className="bh-matches">
                        {matches.map(m => (
                            <div
                                key={m.id}
                                className={`bh-match-card ${selectedId === m.id ? 'selected' : ''}`}
                            >
                                <div className="bh-match-left">
                                    <span className="bh-cargo-icon">{m.cargo.icon}</span>
                                    <div>
                                        <div className="bh-cargo-name">{m.cargo.type}</div>
                                        <div className="bh-cargo-desc">{m.cargo.desc}</div>
                                    </div>
                                </div>
                                <div className="bh-match-pills">
                                    <span className="bh-pill bh-pill-weight">📦 {m.weightT}T</span>
                                    <span className="bh-pill bh-pill-dist">📍 {m.distKm} km</span>
                                    <span className={`bh-pill bh-pill-urgency ${m.urgencyColor}`}>{m.urgency}</span>
                                </div>
                                <div className="bh-match-right">
                                    <div className="bh-payout">₹{m.payout.toLocaleString('en-IN')}</div>
                                    <div className="bh-shipper">{m.shipper}</div>
                                    <button
                                        className="bh-accept-btn"
                                        onClick={() => handleAccept(m)}
                                    >
                                        Accept Load
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!accepted && (
                    <button className="bh-skip" onClick={onDismiss}>
                        Skip — I'll return empty
                    </button>
                )}
            </div>
        </div>
    );
}
