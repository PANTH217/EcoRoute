import { useState, useEffect, useRef } from 'react';
import { searchLocations } from '../utils/osmServices';
import { parseMagicDispatch } from '../utils/aiAdvisor';

const VEHICLES = []; // No longer used manually
const FUELS = [];    // No longer used manually

function AutocompleteInput({ label, placeholder, value, onChange, onSelect, dotClass }) {
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [loading, setLoading] = useState(false);
    const timeoutRef = useRef(null);

    const handleInputChange = (e) => {
        const val = e.target.value;
        onChange(val);

        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        if (val.length > 2) {
            setLoading(true);
            timeoutRef.current = setTimeout(async () => {
                try {
                    const results = await searchLocations(val);
                    setSuggestions(results);
                    setShowSuggestions(true);
                } catch (err) {
                    console.error('Nominatim error:', err);
                } finally {
                    setLoading(false);
                }
            }, 500);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    return (
        <div className="field-group" style={{ position: 'relative' }}>
            <label className="field-label">
                <span className={`field-dot ${dotClass}`} />
                {label}
            </label>
            <input
                className="location-input"
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                required
            />
            {showSuggestions && (
                <ul className="pac-container" style={{ display: 'block', width: '100%', position: 'absolute', top: '100%', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            className="pac-item"
                            onMouseDown={() => {
                                onSelect(s);
                                setShowSuggestions(false);
                            }}
                        >
                            <span className="pac-item-query">{s.display_name}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default function SearchPanel({ onSearch, loading: globalLoading, fleet = [], onLogout }) {
    const [vehicleType, setVehicleType] = useState('car');
    const [fuelType, setFuelType] = useState('petrol');

    const [origin, setOrigin] = useState('');
    const [originData, setOriginData] = useState(null);

    const [destination, setDestination] = useState('');
    const [destinationData, setDestinationData] = useState(null);

    const [payload, setPayload] = useState(5);
    const [selectedFleetId, setSelectedFleetId] = useState('');
    const [dispatchDate, setDispatchDate] = useState(new Date().toISOString().split('T')[0]);
    const [dispatchTime, setDispatchTime] = useState(`${new Date().getHours().toString().padStart(2, '0')}:00`);

    // Magic Dispatch State
    const [magicQuery, setMagicQuery] = useState('');
    const [isMagicLoading, setIsMagicLoading] = useState(false);


    useEffect(() => {
        if (vehicleType === 'ev') setFuelType('electric');
        // Default payload for heavy vehicles
        if (vehicleType === 'truck' || vehicleType === 'bus') {
            if (payload === 0) setPayload(5);
        } else {
            setPayload(0);
        }
    }, [vehicleType]);

    const handleSearch = (e) => {
        e.preventDefault();
        if (!originData || !destinationData) {
            alert('Please select origin and destination.');
            return;
        }
        if (!selectedFleetId) {
            alert('Please select a vehicle from your fleet to calculate eco-metrics.');
            return;
        }

        const v = fleet.find(item => item.id === parseInt(selectedFleetId));

        onSearch({
            origin: [originData.lat, originData.lon],
            destination: [destinationData.lat, destinationData.lon],
            originName: origin,
            destinationName: destination,
            fuelType: v.fuelType,
            payload: parseFloat(payload),
            vehicleId: parseInt(selectedFleetId),
            dispatchDate,
            dispatchTime
        });
    };


    const handleFleetSelect = (id) => {
        setSelectedFleetId(id);
    };

    const showPayload = true; // Always show for fleet vehicles

    return (
        <form className="search-panel" onSubmit={handleSearch}>
            <div className="panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                    <span className="panel-logo">🌿</span>
                    <div style={{ flex: 1 }}>
                        <h1 className="panel-title">EcoRoute</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <p className="panel-sub" style={{ margin: 0 }}>Fleet Command Center</p>
                            {onLogout && (
                                <button
                                    type="button"
                                    onClick={onLogout}
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        border: '1px solid rgba(255, 255, 255, 0.2)',
                                        color: 'rgba(255, 255, 255, 0.7)',
                                        borderRadius: '6px',
                                        padding: '4px 12px',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: '600',
                                        textTransform: 'uppercase',
                                        letterSpacing: '1px',
                                        transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                                        marginLeft: 'auto',
                                        boxShadow: '0 0 10px rgba(255, 255, 255, 0.05)',
                                        animation: 'pulse-border 3s infinite alternate'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.color = '#ff4d4d';
                                        e.currentTarget.style.borderColor = '#ff4d4d';
                                        e.currentTarget.style.background = 'rgba(255, 77, 77, 0.1)';
                                        e.currentTarget.style.boxShadow = '0 0 15px rgba(255, 77, 77, 0.3)';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.animation = 'none'; // Pause breathing on hover
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.boxShadow = '0 0 10px rgba(255, 255, 255, 0.05)';
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.animation = 'pulse-border 3s infinite alternate';
                                    }}
                                >
                                    Disconnect
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* MAGIC DISPATCH (NLP Routing) */}
            <div className="field-group" style={{ marginBottom: '20px' }}>
                <label className="field-label" style={{ color: '#00e676', fontWeight: 'bold' }}>
                    🎙️ Magic Dispatch (Ask Lorri.AI)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                        className="location-input"
                        style={{ border: '1px solid rgba(0, 230, 118, 0.4)', background: 'rgba(0, 230, 118, 0.05)' }}
                        placeholder="e.g., 'Send 15 tons of steel to Surat using an EV'"
                        value={magicQuery}
                        onChange={(e) => setMagicQuery(e.target.value)}
                        onKeyDown={async (e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                if (!magicQuery) return;
                                setIsMagicLoading(true);
                                try {
                                    // 1. NLP parsing
                                    const params = await parseMagicDispatch(magicQuery);

                                    // 2. Geocoding origin & destination
                                    const originResults = await searchLocations(params.origin);
                                    const destResults = await searchLocations(params.destination);

                                    if (!originResults.length || !destResults.length) {
                                        alert("Lorri.AI couldn't pinpoint those locations. Please try again.");
                                        setIsMagicLoading(false);
                                        return;
                                    }

                                    const originMatch = originResults[0];
                                    const destMatch = destResults[0];

                                    // 3. Match a vehicle from fleet
                                    let bestVehicle = fleet.length > 0 ? fleet[0] : null;
                                    if (bestVehicle && params.vehiclePreference) {
                                        const pref = params.vehiclePreference.toLowerCase();
                                        const match = fleet.find(v =>
                                            (pref.includes('electric') && v.fuelType === 'electric') ||
                                            (pref.includes('diesel') && v.fuelType === 'diesel') ||
                                            (pref.includes(v.fuelType.toLowerCase()))
                                        );
                                        if (match) bestVehicle = match;
                                    }

                                    if (!bestVehicle) {
                                        alert("No vehicles available in the fleet to handle this dispatch.");
                                        setIsMagicLoading(false);
                                        return;
                                    }

                                    // 4. Update Form UI completely
                                    setOrigin(originMatch.display_name);
                                    setOriginData(originMatch);
                                    setDestination(destMatch.display_name);
                                    setDestinationData(destMatch);
                                    setPayload(params.payload || 5);
                                    setSelectedFleetId(bestVehicle.id.toString()); // Must be a string for the select input
                                    setVehicleType(bestVehicle.type);
                                    setFuelType(bestVehicle.fuelType);

                                    // 5. Instantly submit the search with the fetched data!
                                    // Use the directly resolved variables, not the state variables, 
                                    // because React state updates are asynchronous and won't be ready yet.
                                    onSearch({
                                        origin: [originMatch.lat, originMatch.lon],
                                        destination: [destMatch.lat, destMatch.lon],
                                        originName: originMatch.display_name,
                                        destinationName: destMatch.display_name,
                                        fuelType: bestVehicle.fuelType,
                                        payload: parseFloat(params.payload) || 5,
                                        vehicleId: parseInt(bestVehicle.id),
                                        dispatchDate,
                                        dispatchTime
                                    });

                                    setMagicQuery(''); // Clear after success
                                } catch (err) {
                                    alert(err.message || "Magic Dispatch failed. Please check your API key.");
                                } finally {
                                    setIsMagicLoading(false);
                                }
                            }
                        }}
                        disabled={isMagicLoading}
                    />
                </div>
                {isMagicLoading && <p style={{ fontSize: '0.8rem', color: '#00e676', fontStyle: 'italic', marginTop: '4px', animation: 'pulse 1.5s infinite' }}>Lorri.AI is orchestrating your route...</p>}
            </div>

            <div className="divider" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)' }} />

            <AutocompleteInput
                label="Origin"
                placeholder="e.g. Mumbai, Maharashtra"
                value={origin}
                onChange={setOrigin}
                onSelect={(data) => {
                    setOrigin(data.display_name);
                    setOriginData(data);
                }}
                dotClass="origin-dot"
            />

            <div className="route-line" />

            <AutocompleteInput
                label="Destination"
                placeholder="e.g. Pune, Maharashtra"
                value={destination}
                onChange={setDestination}
                onSelect={(data) => {
                    setDestination(data.display_name);
                    setDestinationData(data);
                }}
                dotClass="dest-dot"
            />

            <div className="divider" />

            {/* Dispatch Date & Time Planning */}
            <div className="field-group">
                <label className="field-label">📅 Dispatch Planning Window</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '10px' }}>
                    <input
                        type="date"
                        className="location-input"
                        value={dispatchDate}
                        onChange={(e) => setDispatchDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        required
                    />
                    <select
                        className="location-input"
                        value={dispatchTime}
                        onChange={(e) => setDispatchTime(e.target.value)}
                        required
                    >
                        {Array.from({ length: 24 }).map((_, i) => (
                            <option key={i} value={`${i.toString().padStart(2, '0')}:00`}>
                                {i.toString().padStart(2, '0')}:00
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="divider" />

            {/* Fleet Selection */}
            <div className="field-group">
                <label className="field-label">🚛 Select Fleet Asset</label>
                <select
                    className="fleet-select"
                    value={selectedFleetId}
                    onChange={(e) => handleFleetSelect(e.target.value)}
                    required
                >
                    <option value="">-- Choose a Vehicle --</option>
                    {fleet.length === 0 && <option disabled>No vehicles in fleet. Go to Fleet tab.</option>}
                    {fleet.map(v => (
                        <option key={v.id} value={v.id}>{v.name} • {v.regNo} ({v.fuelType})</option>
                    ))}
                </select>
            </div>

            {selectedFleetId && (
                <div className="fleet-info-badge animate-slide-in" style={{ background: 'rgba(0, 230, 118, 0.1)', color: 'var(--eco)', border: '1px solid rgba(0, 230, 118, 0.2)' }}>
                    ✅ {fleet.find(v => v.id === parseInt(selectedFleetId))?.name} Ready for Dispatch
                </div>
            )}

            {showPayload && (
                <div className="field-group" style={{ marginTop: '14px' }}>
                    <div className="flex-between">
                        <label className="field-label">Payload / Cargo</label>
                        <span className="badge-val">{payload} Tons</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="20"
                        step="0.5"
                        className="eco-slider"
                        value={payload}
                        onChange={(e) => setPayload(e.target.value)}
                    />
                    <div className="slider-labels">
                        <span>Empty</span>
                        <span>Full (20T)</span>
                    </div>
                </div>
            )}

            <button type="submit" className={`search-btn ${globalLoading ? 'loading' : ''}`} disabled={globalLoading}>
                {globalLoading ? (
                    <>
                        <span className="spinner" /> Calculating…
                    </>
                ) : (
                    <>🔍 Find Eco Routes</>
                )}
            </button>
        </form>
    );
}
