export default function RouteCard({ route, isSelected, onClick }) {
    const { metrics, rank, label, isWinner, summary, distanceText, durationText, ecoScore } = route;

    const savingVsWorst = route.savingCo2 > 0
        ? `Saves ${route.savingCo2.toFixed(2)} kg CO₂ vs worst`
        : null;

    return (
        <div
            className={`route-card ${isWinner ? 'route-winner' : ''} ${isSelected ? 'route-selected' : ''}`}
            onClick={onClick}
        >
            <div className="card-header">
                <div className="card-rank">
                    <span className="rank-num">#{rank}</span>
                    <span className={`label-badge ${isWinner ? 'badge-eco' : rank === 3 ? 'badge-fast' : 'badge-bal'}`}>
                        {label}
                    </span>
                </div>
                <div className="eco-score-pill">
                    <span className="score-label">Eco Score</span>
                    <span className="score-val">{((1 - ecoScore) * 100).toFixed(0)}</span>
                </div>
            </div>

            <div className="card-summary">{summary || `Via highway route ${rank}`}</div>

            <div className="metrics-grid">
                <MetricBox icon="📏" label="Distance" value={distanceText} />
                <MetricBox icon="⏱️" label="Time" value={durationText} />
                {metrics.isEV ? (
                    <MetricBox icon="🔋" label="Energy" value={`${metrics.energyUsed} kWh`} />
                ) : (
                    <MetricBox icon="⛽" label="Fuel" value={`${metrics.fuelUsed} L`} />
                )}
                <MetricBox icon="💸" label="Cost" value={`₹${metrics.cost}`} />
                <MetricBox
                    icon="🌫️"
                    label="CO₂"
                    value={metrics.isEV ? '0 kg ♻️' : `${metrics.co2Kg} kg`}
                    highlight={isWinner && !metrics.isEV}
                />
                {metrics.payload > 0 && (
                    <>
                        <MetricBox icon="📦" label="Cargo" value={`${metrics.payload} Tons`} />
                        <MetricBox
                            icon="📊"
                            label="Efficiency"
                            value={`${metrics.co2PerTkm} g/tkm`}
                            highlight={true}
                        />
                    </>
                )}
            </div>

            {route.tip && (
                <div className="sustainability-tip">
                    <span className="tip-icon">💡</span>
                    <span className="tip-text">{route.tip}</span>
                </div>
            )}

            {savingVsWorst && (
                <div className="saving-tag">
                    🌱 {savingVsWorst}
                </div>
            )}

            {route.warnings?.length > 0 && (
                <div className="warning-tag">⚠️ {route.warnings[0]}</div>
            )}
        </div>
    );
}

function MetricBox({ icon, label, value, highlight }) {
    return (
        <div className={`metric-box ${highlight ? 'metric-highlight' : ''}`}>
            <span className="metric-icon">{icon}</span>
            <span className="metric-label">{label}</span>
            <span className="metric-val">{value}</span>
        </div>
    );
}
