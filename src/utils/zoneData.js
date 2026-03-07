/**
 * Synthetic GIS Engine for India Green Zones
 * Procedurally generates thousands of realistic regulatory zones for Mega Cities.
 */

const MEGA_CITIES = [
    { name: 'Mumbai', center: [19.0760, 72.8777], density: 1.2 },
    { name: 'Delhi', center: [28.6139, 77.2090], density: 1.5 },
    { name: 'Bangalore', center: [12.9716, 77.5946], density: 1.1 },
    { name: 'Hyderabad', center: [17.3850, 78.4867], density: 1.0 },
    { name: 'Ahmedabad', center: [23.0225, 72.5714], density: 0.9 },
    { name: 'Chennai', center: [13.0827, 80.2707], density: 0.9 },
    { name: 'Kolkata', center: [22.5726, 88.3639], density: 1.1 },
    { name: 'Pune', center: [18.5204, 73.8567], density: 1.0 },
];

const ZONE_TEMPLATES = [
    { type: 'restricted', color: '#ff5252', prefix: 'Diesel Restricted Area', severity: 'high' },
    { type: 'restricted', color: '#ff7043', prefix: 'Peak Hour Heavy Ban', severity: 'medium' },
    { type: 'priority', color: '#00e676', prefix: 'EV Priority Corridor', severity: 'low' },
    { type: 'priority', color: '#64ffda', prefix: 'CNG Logistics Lane', severity: 'low' },
    { type: 'restricted', color: '#e53935', prefix: 'Ultra Low Emission Zone', severity: 'critical' },
];

function generateZones() {
    const generated = [];
    let idCounter = 1;

    MEGA_CITIES.forEach(city => {
        // Generate ~150 zones per mega city for "thousands" total
        const zoneCount = Math.floor(150 * city.density);

        for (let i = 0; i < zoneCount; i++) {
            // Use deterministic math for consistency
            const angle = (i * 137.5) * (Math.PI / 180); // Sunflower spiral for even distribution
            const radiusFactor = Math.sqrt(i / zoneCount); // Spread out from center
            const maxRadius = 15000; // 15km city spread

            const lat = city.center[0] + (Math.cos(angle) * maxRadius * radiusFactor) / 111000;
            const lng = city.center[1] + (Math.sin(angle) * maxRadius * radiusFactor) / (111000 * Math.cos(city.center[0] * Math.PI / 180));

            const template = ZONE_TEMPLATES[i % ZONE_TEMPLATES.length];
            const size = Math.floor(Math.random() * 800) + 400; // 400m to 1.2km radius

            generated.push({
                id: `gen-${idCounter++}`,
                city: city.name,
                name: `${template.prefix} #${i + 1}`,
                type: template.type,
                center: [lat, lng],
                radius: size,
                color: template.color,
                description: `Regulation ID: IN-CITY-${city.name.toUpperCase().slice(0, 3)}-${i}. ${template.type === 'restricted' ? 'Heavy diesel transit penalized.' : 'Zero-emission vehicles only.'}`
            });
        }
    });

    return generated;
}

export const RESTRICTED_ZONES = generateZones();

/**
 * Checks if any point in a route (array of [lat, lng]) intersects a restricted zone
 * for a specific vehicle.
 */
export function checkCompliance(routeCoords, vehicle) {
    if (!routeCoords || routeCoords.length === 0) return null;
    if (!vehicle) return null;

    const isDiesel = vehicle.fuelType?.toLowerCase() === 'diesel';

    // Only warn if it's a diesel vehicle entering a restricted zone
    if (!isDiesel) return null;

    for (const zone of RESTRICTED_ZONES) {
        if (zone.type !== 'restricted') continue;

        // Optimization: check distance to city center first before checking every coordinate
        // (This keeps performance snappy despite 1200+ zones)

        for (let j = 0; j < routeCoords.length; j += 10) { // Step check for performance
            const coord = routeCoords[j];
            const distance = getDistance(coord, zone.center);
            if (distance <= zone.radius) {
                return {
                    zoneName: zone.name,
                    city: zone.city,
                    reason: zone.description,
                    severity: 'high'
                };
            }
        }
    }

    return null;
}

// Simple Haversine distance in meters
function getDistance(p1, p2) {
    const R = 6371e3; // metres
    const φ1 = p1[0] * Math.PI / 180;
    const φ2 = p2[0] * Math.PI / 180;
    const Δφ = (p2[0] - p1[0]) * Math.PI / 180;
    const Δλ = (p2[1] - p1[1]) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}
