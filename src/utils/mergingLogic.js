/**
 * Calculate distance between two lat/lon points in km
 */
function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

/**
 * Decode weighted polyline string into coordinates
 */
export function decodePolyline(str, precision = 5) {
    let index = 0, lat = 0, lng = 0, coordinates = [], shift = 0, result = 0, byte = null, lat_change, lng_change, factor = Math.pow(10, precision);
    while (index < str.length) {
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lat_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lat += lat_change;
        byte = null; shift = 0; result = 0;
        do { byte = str.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5; } while (byte >= 0x20);
        lng_change = ((result & 1) ? ~(result >> 1) : (result >> 1)); lng += lng_change;
        coordinates.push([lat / factor, lng / factor]);
    }
    return coordinates;
}

/**
 * Find Hub-to-Hub handover opportunities (NEXUS Orchestration)
 * UPDATED: Detects if the handover is an INTERMEDIATE point along the route
 */
export function findHubHandovers(newSearch, existingTrips) {
    if (!existingTrips || existingTrips.length === 0) return [];

    return existingTrips.map(trip => {
        if (!trip.originPos || !trip.destPos || !trip.geometry) return null;

        // Condition 1: Direct Handover (Already implemented)
        const distHandover = getDistance(
            newSearch.origin[0], newSearch.origin[1],
            trip.destPos[0], trip.destPos[1]
        );

        // Condition 2: Route Interception (NEW: Check if route passes THROUGH a hub)
        const coords = decodePolyline(trip.geometry);
        let interceptedPoint = null;

        // Sampling coordinates to save perf (every 20th point)
        for (let i = 0; i < coords.length; i += 20) {
            const dist = getDistance(newSearch.origin[0], newSearch.origin[1], coords[i][0], coords[i][1]);
            if (dist < 30) { // 30km interception radius
                interceptedPoint = { lat: coords[i][0], lon: coords[i][1] };
                break;
            }
        }

        const isHandover = distHandover < 50;
        const isInterception = interceptedPoint !== null;

        if (isHandover || isInterception) {
            // Precise temporal comparison
            const getFullDate = (d, t) => {
                const datePart = d || new Date().toISOString().split('T')[0];
                const timePart = t || "00:00";
                return new Date(`${datePart}T${timePart}`);
            };

            const tripDate = getFullDate(trip.date, trip.time);
            const searchDate = getFullDate(newSearch.dispatchDate, newSearch.dispatchTime);

            const timeDiffHrs = (tripDate - searchDate) / 36e5;
            const absDiff = Math.abs(timeDiffHrs);

            // Load Overflow Management
            const totalLoad = Number(newSearch.payload || 0) + Number(trip.payload || 0);
            const needsOverflow = totalLoad > 20;

            // Suggestion logic: Force synchronization
            let suggestAction = "Synchronized";
            if (absDiff > 1) {
                suggestAction = timeDiffHrs > 0 ? `Prepone (by ${absDiff.toFixed(1)}h)` : `Postpone (by ${absDiff.toFixed(1)}h)`;
            }

            return {
                ...trip,
                type: isInterception ? 'interception' : 'handover',
                hubLocation: isInterception ? 'Intermediate Hub' : trip.destinationName,
                hubPos: isInterception ? [interceptedPoint.lat, interceptedPoint.lon] : trip.destPos,
                summary: `NEXUS Overflow: ${trip.destinationName}`, // Use trip.destinationName for overflow
                savingCo2: 0,
                originName: isInterception ? 'Intermediate Hub' : trip.destinationName, // Use hubLocation for origin
                destinationName: trip.destinationName, // Use trip.destinationName for destination
                vehicleName: "Overflow Asset (Deploying)",
                timeGap: absDiff.toFixed(1),
                suggestAction,
                totalLoad,
                needsOverflow,
                overflowWeight: needsOverflow ? (totalLoad - 20).toFixed(1) : 0,
                originalDestinationName: trip.destinationName, // Track where the excess cargo actually needs to go
                originalDestinationPos: trip.destPos // Capture coordinates for map rendering
            };
        }
        return null;
    }).filter(Boolean);
}

/**
 * Find trips that could potentially be merged with the new search
 * @param {Object} newSearch - { origin: [lat, lon], destination: [lat, lon], payload: number }
 * @param {Array} existingTrips - List of recorded trips
 * @returns {Array} - List of potential trips to merge with
 */
export function findMergingPotentials(newSearch, existingTrips) {
    if (!existingTrips || existingTrips.length === 0) return [];

    return existingTrips.filter(trip => {
        // 1. Check if the trip already has a route/metrics
        if (!trip.originPos || !trip.destPos) return false;

        // 2. Check for start/end proximity (within 50km)
        const distOrigin = getDistance(
            newSearch.origin[0], newSearch.origin[1],
            trip.originPos[0], trip.originPos[1]
        );
        const distDest = getDistance(
            newSearch.destination[0], newSearch.destination[1],
            trip.destPos[0], trip.destPos[1]
        );

        const geographicallyClose = distOrigin < 50 && distDest < 50;

        // 3. Check capacity (combined payload <= 20 Tons)
        const combinedPayload = Number(newSearch.payload || 0) + Number(trip.payload || 0);
        const capacityAvailable = combinedPayload <= 20;

        return geographicallyClose && capacityAvailable && !trip.isMerged;
    });
}
