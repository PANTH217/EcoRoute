export const SAMPLE_FLEET = [
    { id: 101, name: "NEXUS-Alpha", type: "truck", fuelType: "diesel", efficiency: 32, payloadCapacity: 15, status: "active" },
    { id: 102, name: "ECO-Bolt", type: "ev", fuelType: "electric", efficiency: 12, payloadCapacity: 5, status: "active" },
    { id: 103, name: "NEXUS-Beta", type: "truck", fuelType: "cng", efficiency: 28, payloadCapacity: 12, status: "maintenance" }
];

export const SAMPLE_TRIPS = [
    {
        id: 1710000000000,
        date: "2026-03-05",
        time: "09:30",
        originName: "Mumbai, Maharashtra",
        destinationName: "Surat, Gujarat",
        vehicleName: "NEXUS-Alpha",
        payload: 12.5,
        metrics: { co2Kg: 342.5, cost: 12500, distKm: 280 },
        savingCo2: 45.2,
        isMerged: false,
        vehiclesSaved: 0
    },
    {
        id: 1710000000001,
        date: "2026-03-06",
        time: "14:15",
        originName: "Ahmedabad, Gujarat",
        destinationName: "Vadodara, Gujarat",
        vehicleName: "ECO-Bolt",
        payload: 3.2,
        metrics: { co2Kg: 0, cost: 850, distKm: 110 },
        savingCo2: 88.7,
        isMerged: true,
        vehiclesSaved: 1
    },
    {
        id: 1710000000002,
        date: "2026-03-07",
        time: "11:00",
        originName: "Pune, Maharashtra",
        destinationName: "Mumbai, Maharashtra",
        vehicleName: "NEXUS-Beta",
        payload: 8.0,
        metrics: { co2Kg: 156.4, cost: 7200, distKm: 150 },
        savingCo2: 22.1,
        isMerged: false,
        vehiclesSaved: 0
    }
];
