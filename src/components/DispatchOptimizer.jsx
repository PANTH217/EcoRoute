import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

/**
 * Dispatch Time Optimizer Component
 * Recommends the best time to start a trip based on simulated traffic patterns.
 */
export default function DispatchOptimizer({ baseFuel, fuelType, dispatchDate, dispatchTime }) {
    const data = useMemo(() => {
        const hours = [];
        const isWeekend = dispatchDate ? [0, 6].includes(new Date(dispatchDate).getDay()) : false;

        // Weekday: Heavy morning and evening peaks
        const weekdayProfile = [
            0.8, 0.75, 0.7, 0.7, 0.75, 0.85,
            1.1, 1.4, 1.6, 1.5, 1.3, 1.2,
            1.1, 1.1, 1.2, 1.3, 1.5, 1.7,
            1.6, 1.4, 1.2, 1.1, 1.0, 0.9
        ];

        // Weekend: Smoother, much lower traffic impact
        const weekendProfile = [
            0.7, 0.65, 0.6, 0.6, 0.65, 0.7,
            0.8, 0.9, 1.0, 1.1, 1.1, 1.2,
            1.2, 1.2, 1.1, 1.1, 1.1, 1.2,
            1.1, 1.0, 0.9, 0.85, 0.8, 0.75
        ];

        const trafficProfile = isWeekend ? weekendProfile : weekdayProfile;

        for (let h = 0; h < 24; h++) {
            const multiplier = trafficProfile[h];
            const fuel = parseFloat((baseFuel * multiplier).toFixed(2));
            hours.push({
                hour: h,
                label: `${h}:00`,
                fuel: fuel,
                cost: Math.round(fuel * 104), // ₹104/L base
                isPeak: multiplier > 1.3
            });
        }
        return hours;
    }, [baseFuel, dispatchDate]);

    const bestTime = useMemo(() => {
        return data.reduce((prev, curr) => (prev.fuel < curr.fuel ? prev : curr));
    }, [data]);

    // Use selected time strictly if provided, otherwise fallback to now
    const selectedHour = dispatchTime ? parseInt(dispatchTime.split(':')[0]) : new Date().getHours();

    const plannedFuel = data[selectedHour]?.fuel || baseFuel;
    const savingPercent = Math.round(((plannedFuel - bestTime.fuel) / plannedFuel) * 100);

    if (!baseFuel) return null;

    return (
        <div className="dispatch-optimizer glass animate-slide-in">
            <div className="dispatch-header">
                <div className="dispatch-title">
                    <span className="dispatch-icon">📅</span>
                    <div>
                        <h4>Optimal Dispatch Window</h4>
                        <p>Schedule based on real-time traffic flux</p>
                    </div>
                </div>
                <div className="dispatch-badge">SIMULATED</div>
            </div>

            <div className="dispatch-insight">
                <div className="insight-text">
                    {savingPercent > 5 ? (
                        <>
                            Dispatch at <strong>{bestTime.label}</strong> →
                            <span className="green-text"> {savingPercent}% less fuel</span> vs. now
                        </>
                    ) : (
                        <>Current dispatch window is <strong>optimal</strong>.</>
                    )}
                </div>
            </div>

            <div className="dispatch-chart-container">
                <ResponsiveContainer width="100%" height={120}>
                    <BarChart data={data} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                        <XAxis
                            dataKey="label"
                            fontSize={9}
                            axisLine={false}
                            tickLine={false}
                            interval={3}
                            tick={{ fill: 'rgba(255,255,255,0.4)' }}
                        />
                        <Tooltip
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            contentStyle={{
                                background: '#1a1a2e',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '8px',
                                fontSize: '11px'
                            }}
                            labelStyle={{ color: '#aaa' }}
                        />
                        <Bar dataKey="fuel" radius={[2, 2, 0, 0]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.hour === bestTime.hour ? '#00e676' : (entry.isPeak ? '#ff5252' : 'rgba(255,255,255,0.2)')}
                                    fillOpacity={entry.hour === selectedHour ? 1 : 0.6}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
                <div className="chart-legend">
                    <div className="legend-item"><span className="dot green"></span> Best Time</div>
                    <div className="legend-item"><span className="dot red"></span> Peak Traffic</div>
                    <div className="legend-item current-marker">Selected Dispatch: {selectedHour}:00</div>
                </div>
            </div>

            <div className="dispatch-footer">
                <p>Values estimated in {fuelType === 'electric' ? 'kWh' : 'Litres'} per full route cycle</p>
            </div>
        </div>
    );
}
