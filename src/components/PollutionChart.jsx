import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell,
    ResponsiveContainer,
    LabelList,
} from 'recharts';

const COLORS = ['#00e676', '#64b5f6', '#ffb74d', '#ce93d8'];

export default function PollutionChart({ routes }) {
    if (!routes || routes.length === 0) return null;

    const isEV = routes[0].metrics.isEV;

    const data = routes.map((r, i) => ({
        name: `Route ${r.rank}`,
        co2: r.metrics.co2Kg,
        fuel: r.metrics.fuelUsed || r.metrics.energyUsed,
        cost: r.metrics.cost,
        label: r.label,
    }));

    return (
        <div className="chart-section">
            <h3 className="chart-title">
                {isEV ? '🔋 Energy Comparison' : '🌫️ CO₂ Emission Comparison'}
            </h3>
            <ResponsiveContainer width="100%" height={180}>
                <BarChart data={data} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" tick={{ fill: '#8a8ab0', fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis
                        tick={{ fill: '#8a8ab0', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        unit={isEV ? ' kWh' : ' kg'}
                        width={55}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#1a1a2e',
                            border: '1px solid rgba(0,230,118,0.3)',
                            borderRadius: 12,
                            color: '#e0e0ff',
                        }}
                        formatter={(val, name) =>
                            isEV ? [`${val} kWh`, 'Energy'] : [`${val} kg CO₂`, 'Emissions']
                        }
                    />
                    <Bar dataKey={isEV ? 'fuel' : 'co2'} radius={[6, 6, 0, 0]}>
                        <LabelList
                            dataKey={isEV ? 'fuel' : 'co2'}
                            position="top"
                            style={{ fill: '#e0e0ff', fontSize: 11 }}
                            formatter={(v) => (isEV ? `${v} kWh` : `${v} kg`)}
                        />
                        {data.map((_, index) => (
                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            <div className="cost-summary">
                {routes.map((r, i) => (
                    <div key={i} className="cost-item">
                        <span className="cost-dot" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="cost-route">Route {r.rank}</span>
                        <span className="cost-val">₹{r.metrics.cost}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
