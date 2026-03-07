// ─── Fuel Consumption Rates (L per 100 km) ───────────────────────────────────
export const FUEL_RATES = {
  car: { petrol: 8.5, diesel: 6.8, cng: 5.2, electric: 0 },
  truck: { petrol: 28.0, diesel: 22.0, cng: 18.0, electric: 0 },
  bus: { petrol: 22.0, diesel: 18.0, cng: 14.0, electric: 0 },
  ev: { petrol: 0, diesel: 0, cng: 0, electric: 0 }, // uses kWh
};

// ─── EV Energy Consumption (kWh per 100 km) ──────────────────────────────────
export const EV_RATES = {
  car: 15,
  truck: 80,
  bus: 60,
  ev: 15,
};

// ─── CO₂ Emission Factors (grams per litre) ──────────────────────────────────
export const CO2_FACTORS = {
  petrol: 2310,
  diesel: 2640,
  cng: 1780,
  electric: 0,
};

// ─── Fuel Cost (INR per litre / per kWh) ─────────────────────────────────────
export const FUEL_COST = {
  petrol: 104,
  diesel: 92,
  cng: 76,
  electric: 8, // INR per kWh
};

/**
 * Calculate metrics for a single route leg
 * @param {number} payload - Tons of cargo (0-20)
 */
export function calculateRouteMetrics(distanceM, durationS, vehicleType, fuelType, payload = 0) {
  const distKm = distanceM / 1000;
  const durationMin = durationS / 60;

  const isEV = fuelType === 'electric';

  // Weight Factor: +3% fuel/energy per ton of cargo
  const weightMultiplier = 1 + (payload * 0.03);

  let fuelUsed = 0;
  let energyUsed = 0;
  let co2Grams = 0;
  let cost = 0;

  if (isEV) {
    const kwhPer100 = EV_RATES[vehicleType] || EV_RATES.car;
    energyUsed = (distKm * kwhPer100 * weightMultiplier) / 100;
    co2Grams = 0; // zero tailpipe
    cost = energyUsed * FUEL_COST.electric;
  } else {
    const rate = FUEL_RATES[vehicleType]?.[fuelType] ?? FUEL_RATES.car.petrol;
    fuelUsed = (distKm * rate * weightMultiplier) / 100;
    co2Grams = fuelUsed * (CO2_FACTORS[fuelType] || 2310);
    cost = fuelUsed * (FUEL_COST[fuelType] || 104);
  }

  // Logistics Professional Metric: CO2 per Tonne-Kilometer (g/tkm)
  // Industry standard for shipping efficiency
  const totalCo2Kg = co2Grams / 1000;
  const tkm = payload > 0 ? (payload * distKm) : 1; // avoid div by zero, use 1 ton as proxy if empty
  const co2PerTkm = (totalCo2Kg * 1000) / tkm;

  return {
    distKm: parseFloat(distKm.toFixed(2)),
    durationMin: parseFloat(durationMin.toFixed(1)),
    fuelUsed: parseFloat(fuelUsed.toFixed(2)),
    energyUsed: parseFloat(energyUsed.toFixed(2)),
    co2Kg: parseFloat(totalCo2Kg.toFixed(3)),
    co2PerTkm: parseFloat(co2PerTkm.toFixed(2)),
    cost: parseFloat(cost.toFixed(0)),
    payload: payload,
    isEV,
  };
}

/**
 * Generate a dynamic sustainability tip for the route
 */
function generateSustainabilityTip(route, allRoutes) {
  const winner = allRoutes.find(r => r.rank === 1);
  const fastest = allRoutes.find(r => r.rank === allRoutes.length);

  if (route.rank === 1) {
    const co2Saved = fastest.metrics.co2Kg - route.metrics.co2Kg;
    if (co2Saved > 0) {
      return `Saves ${co2Saved.toFixed(1)}kg of CO₂ compared to the fastest route.`;
    }
    return "Optimized for maximum fuel efficiency and lowest carbon footprint.";
  }

  if (route.id === fastest.id) {
    return "Prioritizes speed; consider the Best Eco route to reduce emissions.";
  }

  // Generic tips for other alternatives
  const fuelDiff = ((route.metrics.fuelUsed / fastest.metrics.fuelUsed) - 1) * 100;
  if (fuelDiff < 0) {
    return `${Math.abs(fuelDiff).toFixed(0)}% more fuel efficient than the fastest path.`;
  }

  return "Uses optimized highway segments to balance time and emissions.";
}

/**
 * Rank routes by eco-score (lower = greener).
 * Weights: CO₂ 50%, fuel 30%, time 20%
 */
export function rankRoutes(routes) {
  if (routes.length === 0) return [];

  const maxCo2 = Math.max(...routes.map((r) => r.metrics.co2Kg), 0.001);
  const maxFuel = Math.max(...routes.map((r) => r.metrics.fuelUsed + r.metrics.energyUsed), 0.001);
  const maxTime = Math.max(...routes.map((r) => r.metrics.durationMin), 0.001);

  const scored = routes.map((route) => {
    const normCo2 = route.metrics.co2Kg / maxCo2;
    const normFuel = (route.metrics.fuelUsed + route.metrics.energyUsed) / maxFuel;
    const normTime = route.metrics.durationMin / maxTime;
    const ecoScore = normCo2 * 0.5 + normFuel * 0.3 + normTime * 0.2;
    return { ...route, ecoScore: parseFloat(ecoScore.toFixed(4)) };
  });

  scored.sort((a, b) => a.ecoScore - b.ecoScore);

  const ranked = scored.map((r, i) => ({
    ...r,
    rank: i + 1,
    label: i === 0 ? '🌿 Best Eco' : i === scored.length - 1 ? '⚡ Fastest' : `⚖️ Alternative #${i}`,
    isWinner: i === 0,
  }));

  // Add dynamic tips
  return ranked.map(r => ({
    ...r,
    tip: generateSustainabilityTip(r, ranked)
  }));
}
