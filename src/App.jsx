import { useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from './firebase';
import Login from './components/Login';
import SearchPanel from './components/SearchPanel';
import MapView from './components/MapView';
import RouteCard from './components/RouteCard';
import PollutionChart from './components/PollutionChart';
import { fetchRoutes } from './utils/osmServices';
import { calculateRouteMetrics, rankRoutes } from './utils/ecoScore';
import EcoMathCard from './components/EcoMathCard';
import './index.css';

import BackhaulAlert from './components/BackhaulAlert';
import DispatchOptimizer from './components/DispatchOptimizer';
import NEXUSOrchestrator from './components/NEXUSOrchestrator';
import { findMergingPotentials, findHubHandovers } from './utils/mergingLogic';
import GenAIExplainer from './components/GenAIExplainer';


import AnalyticsDashboard from './components/AnalyticsDashboard';
import FleetManager from './components/FleetManager';
import { SAMPLE_FLEET, SAMPLE_TRIPS } from './utils/sampleData';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const [activeTab, setActiveTab] = useState('map'); // 'map', 'analytics', or 'fleet'
  const [fleet, setFleet] = useState(() => {
    const saved = localStorage.getItem('ecoroute_fleet');
    return saved ? JSON.parse(saved) : SAMPLE_FLEET;
  });
  const [trips, setTrips] = useState(() => {
    const saved = localStorage.getItem('ecoroute_trips');
    return (saved && JSON.parse(saved).length > 0) ? JSON.parse(saved) : SAMPLE_TRIPS;
  });

  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [originPos, setOriginPos] = useState(null);
  const [destPos, setDestPos] = useState(null);
  const [searched, setSearched] = useState(false);
  const [currentSearchData, setCurrentSearchData] = useState(null);
  const [mergePotentials, setMergePotentials] = useState([]);
  const [handovers, setHandovers] = useState([]);
  const [backhaulTrip, setBackhaulTrip] = useState(null); // trip that triggers backhaul prompt


  // Sync fleet/trips to localStorage
  useEffect(() => {
    localStorage.setItem('ecoroute_fleet', JSON.stringify(fleet));
  }, [fleet]);

  useEffect(() => {
    localStorage.setItem('ecoroute_trips', JSON.stringify(trips));
  }, [trips]);

  const handleSearch = useCallback(async ({ origin, destination, originName, destinationName, vehicleType, fuelType, payload, vehicleId, dispatchDate, dispatchTime }) => {
    setLoading(true);
    setError('');
    setRoutes([]);
    setSearched(true);
    setOriginPos(origin);
    setDestPos(destination);
    setCurrentSearchData({ origin, destination, originName, destinationName, vehicleType, fuelType, payload, vehicleId, dispatchDate, dispatchTime });


    try {
      const rawRoutes = await fetchRoutes(origin, destination);

      // Check for NEXUS Hub Handovers
      try {
        const hubLinks = findHubHandovers({ origin, destination, dispatchDate, dispatchTime }, trips);
        setHandovers(hubLinks || []);
      } catch (nexErr) {
        console.error("NEXUS Orchestration Error:", nexErr);
        setHandovers([]);
      }

      // Check for merging potentials
      const potentials = findMergingPotentials({ origin, destination, payload }, trips);
      setMergePotentials(potentials);

      // Check for NEXUS Hub Handovers
      try {
        const hubLinks = findHubHandovers({ origin, destination, dispatchDate, dispatchTime }, trips);
        setHandovers(hubLinks || []);
      } catch (nexErr) {
        console.error("NEXUS Orchestration Error:", nexErr);
        setHandovers([]);
      }

      // Custom efficiency if a fleet vehicle is used
      const customVehicle = fleet.find(v => v.id === vehicleId);

      const enriched = rawRoutes.map((route) => {
        const metrics = calculateRouteMetrics(
          route.distanceM,
          route.durationS,
          customVehicle?.type || vehicleType,
          customVehicle?.fuelType || fuelType,
          payload
        );

        // Override with custom efficiency if available
        if (customVehicle && customVehicle.efficiency) {
          const distKm = route.distanceM / 1000;
          const weightMultiplier = 1 + (payload * 0.03);
          const consumption = (distKm * customVehicle.efficiency * weightMultiplier) / 100;

          if (customVehicle.fuelType === 'electric') {
            metrics.energyUsed = parseFloat(consumption.toFixed(2));
            metrics.cost = parseFloat((consumption * 9).toFixed(0)); // Assume 9/kWh
          } else {
            metrics.fuelUsed = parseFloat(consumption.toFixed(2));
            metrics.co2Kg = parseFloat((consumption * 2.6).toFixed(3)); // Generic Diesel/Petrol factor
            metrics.cost = parseFloat((consumption * 104).toFixed(0));
          }
        }

        return { ...route, metrics };
      });

      const ranked = rankRoutes(enriched);
      const maxCo2 = Math.max(...ranked.map((r) => r.metrics.co2Kg), 0);
      const withSavings = ranked.map((r) => ({
        ...r,
        savingCo2: maxCo2 - r.metrics.co2Kg,
      }));

      setRoutes(withSavings);
      setSelectedRoute(withSavings[0]?.id ?? null);


    } catch (err) {
      setError(err.message || 'Could not find routes. Check the locations.');
    } finally {
      setLoading(false);
    }
  }, [fleet, trips]);

  const recordTrip = (route) => {
    const vehicle = currentSearchData?.vehicleId ? fleet.find(v => v.id === currentSearchData.vehicleId) : null;
    const vehicleName = vehicle ? vehicle.name : (currentSearchData?.vehicleType || 'Unknown');

    const newTrip = {
      id: Date.now(),
      date: currentSearchData?.dispatchDate || new Date().toISOString().split('T')[0],
      time: currentSearchData?.dispatchTime || "00:00",
      metrics: route.metrics,
      summary: route.summary || route.label,
      savingCo2: route.savingCo2 || 0,
      originPos: originPos,
      destPos: destPos,
      originName: currentSearchData?.originName,
      destinationName: currentSearchData?.destinationName,
      vehicleName: vehicleName,
      payload: currentSearchData?.payload || 0,
      isMerged: false,
      vehiclesSaved: 0,
      geometry: route.geometry // Save the polyline for interception logic
    };
    setTrips([newTrip, ...trips]);
    setMergePotentials([]);
    // Trigger backhaul prompt
    setBackhaulTrip({ ...newTrip, vehicleName });
  };

  const recordOverflowTrip = (handover) => {
    const newTrip = {
      id: Date.now(),
      date: currentSearchData?.dispatchDate || new Date().toISOString().split('T')[0],
      time: currentSearchData?.dispatchTime || "00:00",
      metrics: {
        co2Kg: (handover.overflowWeight * 1.2).toFixed(2), // Rough proxy for overflow emissions
        cost: (handover.overflowWeight * 50).toFixed(0),
        distKm: 150 // Standard Surat to Ahmedabad hub distance for demo
      },
      summary: `NEXUS Overflow: ${handover.originalDestinationName}`,
      savingCo2: 0,
      originName: handover.hubLocation,
      originPos: handover.hubPos,
      destinationName: handover.originalDestinationName,
      destPos: handover.originalDestinationPos,
      vehicleName: "Overflow Asset (Deploying)",
      payload: handover.overflowWeight,
      isMerged: false,
      vehiclesSaved: 0,
      isOverflow: true
    };
    setTrips([newTrip, ...trips]);
    setHandovers([]);
    alert(`🚀 OVERFLOW ASSET DEPLOYED: ${handover.overflowWeight}T dispatched from ${handover.hubLocation} to ${handover.originalDestinationName}.`);
  };

  const mergeTrip = (targetTripId) => {
    const target = trips.find(t => t.id === targetTripId);
    if (!target) return;

    const updatedTrips = trips.map(t => {
      if (t.id === targetTripId) {
        return {
          ...t,
          payload: t.payload + (currentSearchData?.payload || 0),
          vehiclesSaved: (t.vehiclesSaved || 0) + 1,
          isMerged: true // Mark as merged so it doesn't merge again easily in this demo
        };
      }
      return t;
    });

    setTrips(updatedTrips);
    setMergePotentials([]);
    setRoutes([]);
    setSearched(false);
    alert('🤝 SHIPMENT MERGED! One vehicle saved and cargo consolidated.');
  };

  const deleteTrip = (tripId) => {
    setTrips(prev => prev.filter(t => t.id !== tripId));
  };

  const handleBackhaulAccept = ({ match, returnOrigin, returnDest, vehicleName }) => {
    // Calculate realistic emissions for the return loaded trip
    // Truck baseline: ~30 L/100km diesel, 2.68 kg CO₂/L
    // Payload adjustment: +3% fuel per ton carried
    const baseFuelPer100km = 30;
    const co2PerLiterDiesel = 2.68;
    const payloadFactor = 1 + (match.weightT * 0.03);
    const fuelLitres = (match.distKm / 100) * baseFuelPer100km * payloadFactor;
    const co2Kg = parseFloat((fuelLitres * co2PerLiterDiesel).toFixed(1));

    // "Saving" = the empty deadhead CO₂ that would have been emitted with no load
    // (empty truck emits ~80% of loaded truck's emissions, so the cargo adds only 20% more CO₂
    //  but earns revenue — vs a full deadhead that would have emitted the baseline anyway)
    const emptyDeadheadCo2 = parseFloat(((match.distKm / 100) * baseFuelPer100km * co2PerLiterDiesel).toFixed(1));
    const savingCo2 = parseFloat((emptyDeadheadCo2 * 0.2).toFixed(1)); // marginal extra vs going empty

    const backhaulEntry = {
      id: Date.now(),
      date: new Date().toISOString(),
      metrics: { co2Kg, cost: match.payout, distKm: match.distKm },
      summary: `Backhaul: ${match.cargo.type}`,
      savingCo2,
      originName: returnOrigin,
      destinationName: returnDest,
      vehicleName: vehicleName || 'Unknown',
      payload: match.weightT,
      isMerged: false,
      vehiclesSaved: 0,
      isBackhaul: true,
      backhaulPayout: match.payout,
    };
    setTrips(prev => [backhaulEntry, ...prev]);
    setBackhaulTrip(null);
    alert(`✅ Backhaul booked! ₹${match.payout.toLocaleString('en-IN')} earned. No empty miles!`);
  };

  const winner = routes.find((r) => r.rank === 1);

  // Helper to decode polyline for compliance check
  function decodePolyline(str, precision = 5) {
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

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (authLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#000402', color: '#00e676', fontSize: '1.2rem', letterSpacing: '2px' }}>
        <div className="animate-pulse">Authenticating NEXUS Protocols...</div>
      </div>
    );
  }

  if (!user) {
    return <Login onLoginComplete={setUser} />;
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="nav-tabs">
          <button
            className={`nav-btn ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            📍 Optimizer
          </button>
          <button
            className={`nav-btn ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            🚛 Fleet
          </button>
          <button
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 ESG Analytics
          </button>
        </div>

        <SearchPanel
          onSearch={handleSearch}
          loading={loading}
          fleet={fleet}
          onLogout={handleLogout}
        />

        {error && <div className="error-box">⚠️ {error}</div>}

        {/* NEXUS Orchestration - Temporarily Removed
        <NEXUSOrchestrator
          handovers={handovers}
          onSync={(h) => alert(`🧬 NEXUS LINK ESTABLISHED: Payload synchronized for ${h.hubLocation} Hub.`)}
          onDeployOverflow={recordOverflowTrip}
        />
        */}

        {/* Development/Demo Assist */}
        {/* NEXUS Demo Trigger - Temporarily Removed
        {handovers.length === 0 && !loading && (
          <button
            onClick={() => setHandovers([{
              vehicleName: "NEXUS-Alpha (Scheduled: 9th March)",
              hubLocation: "Surat (Coordination Hub)",
              timeGap: "12.5",
              suggestAction: "Prepone (by 12.5h)",
              summary: "Valsad -> Bharuch Interception",
              totalLoad: 25.5,
              needsOverflow: true,
              overflowWeight: 5.5,
              originalDestinationName: "Bharuch",
              destinationName: "Bharuch",
              hubPos: [21.1702, 72.8311], // Surat
              originalDestinationPos: [21.7051, 72.9959] // Bharuch
            }])}
            style={{
              margin: '0 20px 20px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px dashed rgba(255,255,255,0.2)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '10px',
              padding: '8px',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            🧪 Debug: Trigger NEXUS Demo Mode
          </button>
        )}
        */}

        {/* Gen-AI Route Explainer */}
        {routes.length > 0 && currentSearchData && (
          <GenAIExplainer
            routes={routes}
            vehicleType={currentSearchData.vehicleType || 'truck'}
            payload={currentSearchData?.payload}
            originName={currentSearchData.originName}
            destinationName={currentSearchData.destinationName}
          />
        )}

        {mergePotentials.length > 0 && (
          <div className="merge-alert-box glass">
            <div className="merge-alert-header">
              <span>🤝</span> Co-loading Opportunity Found!
            </div>
            <p className="merge-alert-desc">
              A trip on this route already has space. Merge to save 100% emissions for this leg.
            </p>
            {mergePotentials.map(tp => (
              <div key={tp.id} className="merge-item">
                <div className="merge-item-info">
                  <strong>{tp.summary}</strong>
                  <span>Current Load: {tp.payload}T</span>
                </div>
                <button className="merge-action-btn" onClick={() => mergeTrip(tp.id)}>
                  Smart Merge
                </button>
              </div>
            ))}
          </div>
        )}

        {searched && !loading && routes.length === 0 && !error && (
          <div className="empty-state">No routes found. Try different locations.</div>
        )}

        {routes.length > 0 && (
          <div className="results-section">
            {winner && (
              <div className="winner-banner">
                {/* Optimal Time Window - Temporarily Removed
                <DispatchOptimizer
                  baseFuel={winner.metrics.fuelL || winner.metrics.kWh}
                  fuelType={winner.metrics.fuelType}
                  dispatchDate={currentSearchData?.dispatchDate}
                  dispatchTime={currentSearchData?.dispatchTime}
                />
                */}

                <div className="section-title">🚀 Optimized Routes</div>

                <div className="winner-stats">
                  <span>💨 {winner.metrics.co2Kg} kg CO₂</span>
                  <span>💸 ₹{winner.metrics.cost}</span>
                  <button onClick={() => recordTrip(winner)} className="record-btn">Confirm Trip</button>
                </div>
              </div>
            )}

            <PollutionChart routes={routes} />
            <div className="routes-list">
              {routes.map((route) => (
                <div key={route.id} style={{ position: 'relative' }}>
                  <RouteCard
                    route={route}
                    isSelected={route.id === selectedRoute}
                    onClick={() => setSelectedRoute(route.id)}
                  />
                  {route.id === selectedRoute && (
                    <button
                      className="mini-record-btn"
                      onClick={() => recordTrip(route)}
                    >
                      Log Trip
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </aside>

      <main className="map-area">
        {activeTab === 'map' ? (
          <>
            <MapView
              routes={routes}
              selectedRoute={selectedRoute}
              origin={originPos}
              destination={destPos}
            />
            <EcoMathCard />
          </>
        ) : activeTab === 'fleet' ? (
          <FleetManager fleet={fleet} onUpdateFleet={setFleet} />
        ) : (
          <AnalyticsDashboard trips={trips} onDeleteTrip={deleteTrip} />
        )}
      </main>

      {/* Backhaul Return Trip Optimizer Modal */}
      {backhaulTrip && (
        <BackhaulAlert
          trip={backhaulTrip}
          vehicleName={backhaulTrip.vehicleName}
          onAccept={handleBackhaulAccept}
          onDismiss={() => setBackhaulTrip(null)}
        />
      )}
    </div>
  );
}


