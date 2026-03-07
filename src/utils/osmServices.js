/**
 * Fetch multiple route alternatives using a multi-pass strategy
 */
export async function fetchRoutes(origin, destination) {
    const [origLat, origLng] = origin;
    const [destLat, destLng] = destination;

    // Strategy: Primary OSRM Alternatives + Sublte "Soft Pivot" for diversity
    // Call 1: Direct with native professional alternatives
    const url1 = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${destLng},${destLat}?alternatives=3&overview=full&geometries=polyline`;

    // Call 2: Soft Pivot - Use a very small perpendicular nudge to find another highway 
    // without forcing a massive detour. (0.05 deg ~ 5km offset)
    const midLat = (origLat + destLat) / 2;
    const midLng = (origLng + destLng) / 2;
    const dLat = destLat - origLat;
    const dLng = destLng - origLng;
    const waypointLat = midLat + (dLng * 0.05);
    const waypointLng = midLng - (dLat * 0.05);

    const url2 = `https://router.project-osrm.org/route/v1/driving/${origLng},${origLat};${waypointLng},${waypointLat};${destLng},${destLat}?overview=full&geometries=polyline`;

    try {
        const [res1, res2] = await Promise.allSettled([
            fetch(url1).then(r => r.json()),
            fetch(url2).then(r => r.json())
        ]);

        let allRoutes = [];
        if (res1.status === 'fulfilled' && res1.value.code === 'Ok') {
            allRoutes = [...allRoutes, ...res1.value.routes];
        }
        if (res2.status === 'fulfilled' && res2.value.code === 'Ok') {
            allRoutes = [...allRoutes, ...res2.value.routes];
        }

        if (allRoutes.length === 0) throw new Error('No routes found');

        // Logic Filter: Only keep routes that are realistic for logistics
        const shortestDist = Math.min(...allRoutes.map(r => r.distance));
        const uniqueRoutes = [];
        const seenSignatures = new Set();

        // Rank by distance initially to prioritize the most logical paths
        allRoutes.sort((a, b) => a.distance - b.distance);

        allRoutes.forEach(route => {
            const distKm = Math.round(route.distance / 1000);

            // Logics Guard: 
            // 1. Must not be too much longer than the shortest path (Max 25% deviation)
            const isLogical = route.distance <= shortestDist * 1.25;

            // 2. Must be distinct enough to be a real choice (at least 2km difference or different summary)
            const isDistinct = !Array.from(seenSignatures).some(s => Math.abs(s - distKm) < 2);

            if (isLogical && isDistinct && uniqueRoutes.length < 3) {
                uniqueRoutes.push(route);
                seenSignatures.add(distKm);
            }
        });

        return uniqueRoutes.map((route, idx) => ({
            id: idx,
            // Clean up summaries - remove implementations details like '& Path'
            summary: route.legs.length > 1
                ? (route.legs[0].summary || route.legs[1].summary || 'Alternative Path')
                : (route.legs[0].summary || `Route ${idx + 1}`),
            distanceM: route.distance,
            distanceText: `${(route.distance / 1000).toFixed(1)} km`,
            durationS: route.duration,
            durationText: `${Math.round(route.duration / 60)} min`,
            polyline: route.geometry,
            warnings: []
        }));

    } catch (err) {
        console.error('Routing Error:', err);
        throw new Error('Failed to fetch routes from OSRM server');
    }
}

/**
 * Geocode a query string using Nominatim
 */
export async function searchLocations(query) {
    if (query.length < 3) return [];
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=5&countrycodes=in`;
    const response = await fetch(url, { headers: { 'User-Agent': 'EcoRoute-Optimizer' } });
    if (!response.ok) throw new Error('Location fetch failed');
    const data = await response.json();
    return data.map(item => ({
        display_name: item.display_name,
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon)
    }));
}
