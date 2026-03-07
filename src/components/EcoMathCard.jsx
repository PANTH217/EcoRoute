export default function EcoMathCard() {
    return (
        <div className="eco-math-card">
            <div className="math-header">
                <span>🧪</span> Logistics Calculation Logic
            </div>

            <p className="math-desc">
                Logistics-grade estimation based on real-world payload impact and energy factors:
            </p>

            <div className="math-formula" style={{ lineHeight: '1.6' }}>
                Fuel = (Dist × Rate × (1 + Payload × 3%)) / 100 <br />
                Efficiency = Total CO₂ / (Payload × Dist)
            </div>

            <ul style={{ paddingLeft: '14px', marginBottom: '8px' }}>
                <li><b>Payload:</b> +3% fuel increase for every 1 ton of cargo.</li>
                <li><b>tkm Metric:</b> Industry standard for carbon reporting.</li>
                <li><b>Rates:</b> ARAI Standard (L/100km) verified.</li>
            </ul>

            <span className="math-source">
                Data Sources: ARAI India, GLC Framework for Logistics Sustainability
            </span>
        </div>
    );
}
