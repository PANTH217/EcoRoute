import { useState, useEffect, useRef } from 'react';

const MARKET_BASE = 800;    // ₹/tonne floor
const MARKET_CEIL = 1400;   // ₹/tonne ceiling

function randomRate() {
    return Math.floor(Math.random() * (MARKET_CEIL - MARKET_BASE + 1)) + MARKET_BASE;
}

export default function CarbonCreditPanel({ trips = [] }) {
    const [marketRate, setMarketRate] = useState(randomRate());
    const [prevRate, setPrevRate] = useState(marketRate);
    const [showModal, setShowModal] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [soldHistory, setSoldHistory] = useState([]);
    const timerRef = useRef(null);

    // Total CO₂ saved in kg across all trips
    const totalCo2SavedKg = trips.reduce((acc, t) => acc + (t.savingCo2 || 0), 0);

    // 1 CER = 1 tonne = 1000 kg
    const creditsEarned = totalCo2SavedKg / 1000;

    // Portfolio value
    const portfolioValue = (creditsEarned * marketRate).toFixed(0);

    // Bid = marketRate - 20, Ask = marketRate + 30
    const bid = marketRate - 20;
    const ask = marketRate + 30;

    const rateDir = marketRate > prevRate ? 'up' : marketRate < prevRate ? 'down' : 'flat';

    useEffect(() => {
        timerRef.current = setInterval(() => {
            setMarketRate(r => {
                const next = randomRate();
                setPrevRate(r);
                return next;
            });
        }, 5000);
        return () => clearInterval(timerRef.current);
    }, []);

    const handleSell = () => {
        if (creditsEarned <= 0) return;
        const tradeValue = (creditsEarned * marketRate).toFixed(0);
        const record = {
            date: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
            credits: creditsEarned.toFixed(4),
            rate: marketRate,
            value: tradeValue,
        };
        setSoldHistory(h => [record, ...h]);
        setShowModal(false);
        setToastMsg(`✅ Trade Confirmed — ₹${parseInt(tradeValue).toLocaleString('en-IN')} credited to your account!`);
        setTimeout(() => setToastMsg(''), 5000);
    };

    return (
        <>
            {/* ─── Toast ─── */}
            {toastMsg && (
                <div className="cc-toast">
                    {toastMsg}
                </div>
            )}

            {/* ─── Main Panel ─── */}
            <div className="cc-panel glass">
                {/* Header */}
                <div className="cc-header">
                    <div>
                        <h3 className="cc-title">🏷️ Carbon Credit Portfolio</h3>
                        <p className="cc-subtitle">India Voluntary Carbon Market (VCM) · Real-time simulation</p>
                    </div>
                    <div className="cc-sdg-chip">SDG 13 · Climate Action</div>
                </div>

                {/* Market Ticker */}
                <div className="cc-ticker-bar">
                    <div className="cc-ticker-item">
                        <span className="cc-ticker-label">LIVE RATE</span>
                        <span className={`cc-ticker-price ${rateDir === 'up' ? 'price-up' : rateDir === 'down' ? 'price-down' : ''}`}>
                            ₹{marketRate.toLocaleString('en-IN')}
                            <span className="cc-ticker-arrow">
                                {rateDir === 'up' ? ' ▲' : rateDir === 'down' ? ' ▼' : ' ─'}
                            </span>
                        </span>
                        <span className="cc-ticker-unit">per tonne CO₂</span>
                    </div>
                    <div className="cc-ticker-divider" />
                    <div className="cc-ticker-item">
                        <span className="cc-ticker-label">BID</span>
                        <span className="cc-ticker-secondary">₹{bid.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="cc-ticker-divider" />
                    <div className="cc-ticker-item">
                        <span className="cc-ticker-label">ASK</span>
                        <span className="cc-ticker-secondary">₹{ask.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="cc-ticker-divider" />
                    <div className="cc-ticker-item">
                        <span className="cc-ticker-label">EXCHANGE</span>
                        <span className="cc-ticker-secondary">IVCM · India</span>
                    </div>
                </div>

                {/* KPI Row */}
                <div className="cc-kpi-row">
                    <div className="cc-kpi">
                        <span className="cc-kpi-icon">🌿</span>
                        <div>
                            <div className="cc-kpi-label">Total CO₂ Saved</div>
                            <div className="cc-kpi-value">{totalCo2SavedKg.toFixed(2)} kg</div>
                        </div>
                    </div>
                    <div className="cc-kpi-sep">→</div>
                    <div className="cc-kpi">
                        <span className="cc-kpi-icon">🏷️</span>
                        <div>
                            <div className="cc-kpi-label">Credits Earned</div>
                            <div className="cc-kpi-value credit-glow">{creditsEarned.toFixed(4)} CERs</div>
                        </div>
                    </div>
                    <div className="cc-kpi-sep">×</div>
                    <div className="cc-kpi">
                        <span className="cc-kpi-icon">📈</span>
                        <div>
                            <div className="cc-kpi-label">Market Rate</div>
                            <div className="cc-kpi-value">₹{marketRate.toLocaleString('en-IN')}/t</div>
                        </div>
                    </div>
                    <div className="cc-kpi-sep">=</div>
                    <div className="cc-kpi portfolio-kpi">
                        <span className="cc-kpi-icon">💰</span>
                        <div>
                            <div className="cc-kpi-label">Portfolio Value</div>
                            <div className="cc-kpi-value portfolio-value">₹{parseInt(portfolioValue).toLocaleString('en-IN')}</div>
                        </div>
                    </div>
                </div>

                {/* Actions + History */}
                <div className="cc-bottom-row">
                    {creditsEarned > 0 ? (
                        <button className="cc-sell-btn" onClick={() => setShowModal(true)}>
                            Sell Credits on Exchange
                            <span className="cc-sell-badge">{creditsEarned.toFixed(2)} CER available</span>
                        </button>
                    ) : (
                        <div className="cc-empty-note">
                            🚛 Confirm eco-routes to start earning Carbon Credits
                        </div>
                    )}

                    {soldHistory.length > 0 && (
                        <div className="cc-trade-history">
                            <div className="cc-trade-title">📋 Trade History</div>
                            {soldHistory.slice(0, 3).map((rec, i) => (
                                <div key={i} className="cc-trade-row">
                                    <span className="cc-trade-date">{rec.date}</span>
                                    <span className="cc-trade-qty">{rec.credits} CER</span>
                                    <span className="cc-trade-rate">@ ₹{rec.rate}</span>
                                    <span className="cc-trade-val">₹{parseInt(rec.value).toLocaleString('en-IN')}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ─── Marketplace Modal ─── */}
            {showModal && (
                <div className="cc-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="cc-modal glass" onClick={e => e.stopPropagation()}>
                        <div className="cc-modal-header">
                            <div>
                                <h3 className="cc-modal-title">🏛️ India Voluntary Carbon Exchange</h3>
                                <p className="cc-modal-sub">IVCM · Simulated Order Book</p>
                            </div>
                            <button className="cc-modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>

                        <div className="cc-order-book">
                            <div className="cc-ob-header">
                                <span>Side</span><span>Qty (CERs)</span><span>Price (₹/t)</span><span>Total (₹)</span>
                            </div>
                            {[ask + 50, ask + 30, ask + 10, ask].map((p, i) => (
                                <div key={i} className="cc-ob-row ask-row">
                                    <span className="cc-side ask">ASK</span>
                                    <span>{(Math.random() * 5 + 0.1).toFixed(2)}</span>
                                    <span>{p.toLocaleString('en-IN')}</span>
                                    <span>{(p * (Math.random() * 5 + 0.1)).toFixed(0)}</span>
                                </div>
                            ))}
                            <div className="cc-ob-spread">
                                Spread: ₹{(ask - bid)} &nbsp;|&nbsp; Mid: ₹{Math.floor((ask + bid) / 2).toLocaleString('en-IN')}
                            </div>
                            {[bid, bid - 10, bid - 30, bid - 50].map((p, i) => (
                                <div key={i} className="cc-ob-row bid-row">
                                    <span className="cc-side bid">BID</span>
                                    <span>{(Math.random() * 5 + 0.1).toFixed(2)}</span>
                                    <span>{p.toLocaleString('en-IN')}</span>
                                    <span>{(p * (Math.random() * 5 + 0.1)).toFixed(0)}</span>
                                </div>
                            ))}
                        </div>

                        <div className="cc-sell-summary">
                            <div className="cc-sell-detail">
                                <span>Your Credits</span>
                                <strong>{creditsEarned.toFixed(4)} CERs</strong>
                            </div>
                            <div className="cc-sell-detail">
                                <span>Best Bid</span>
                                <strong>₹{bid.toLocaleString('en-IN')}/t</strong>
                            </div>
                            <div className="cc-sell-detail highlight">
                                <span>You Receive</span>
                                <strong className="cc-receive-val">₹{(creditsEarned * bid).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}</strong>
                            </div>
                        </div>

                        <button className="cc-confirm-sell-btn" onClick={handleSell}>
                            ✅ Sell Now — Confirm Trade
                        </button>
                        <p className="cc-disclaimer">* Simulated market for demonstration purposes. Prices reflect India VCM rates.</p>
                    </div>
                </div>
            )}
        </>
    );
}
