import React, { useState } from 'react';

export default function FleetManager({ fleet, onUpdateFleet }) {
    const [showAddForm, setShowAddForm] = useState(false);
    const [newVehicle, setNewVehicle] = useState({
        name: '',
        type: 'truck',
        fuelType: 'diesel',
        efficiency: '', // L/100km or kWh/100km
        regNo: ''
    });

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newVehicle.name || !newVehicle.efficiency) return;

        const vehicle = {
            ...newVehicle,
            id: Date.now(),
            efficiency: parseFloat(newVehicle.efficiency)
        };

        onUpdateFleet([...fleet, vehicle]);
        setNewVehicle({ name: '', type: 'truck', fuelType: 'diesel', efficiency: '', regNo: '' });
        setShowAddForm(false);
    };

    const removeVehicle = (id) => {
        onUpdateFleet(fleet.filter(v => v.id !== id));
    };

    return (
        <div className="fleet-container">
            <header className="fleet-header">
                <div>
                    <h2 className="analytics-title">Fleet Management</h2>
                    <p className="analytics-subtitle">Manage your organization's transport assets</p>
                </div>
                <button className="add-fleet-btn" onClick={() => setShowAddForm(!showAddForm)}>
                    {showAddForm ? '✕ Cancel' : '+ Add Vehicle'}
                </button>
            </header>

            {showAddForm && (
                <form className="add-vehicle-form glass" onSubmit={handleAdd}>
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Vehicle Name / Model</label>
                            <input
                                type="text"
                                placeholder="e.g. Tata Prima G.35"
                                value={newVehicle.name}
                                onChange={e => setNewVehicle({ ...newVehicle, name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label>Registration No.</label>
                            <input
                                type="text"
                                placeholder="MH 12 AB 1234"
                                value={newVehicle.regNo}
                                onChange={e => setNewVehicle({ ...newVehicle, regNo: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label>Type</label>
                            <select
                                value={newVehicle.type}
                                onChange={e => setNewVehicle({ ...newVehicle, type: e.target.value })}
                            >
                                <option value="car">Car</option>
                                <option value="truck">Truck</option>
                                <option value="bus">Bus</option>
                                <option value="ev">Electric Vehicle</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Fuel Type</label>
                            <select
                                value={newVehicle.fuelType}
                                onChange={e => setNewVehicle({ ...newVehicle, fuelType: e.target.value })}
                                disabled={newVehicle.type === 'ev'}
                            >
                                <option value="diesel">Diesel</option>
                                <option value="petrol">Petrol</option>
                                <option value="cng">CNG</option>
                                <option value="electric">Electric</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Efficiency ({newVehicle.type === 'ev' || newVehicle.fuelType === 'electric' ? 'kWh' : 'L'}/100km)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="e.g. 28.5"
                                value={newVehicle.efficiency}
                                onChange={e => setNewVehicle({ ...newVehicle, efficiency: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <button type="submit" className="save-vehicle-btn">Save to Fleet</button>
                </form>
            )}

            <div className="fleet-list">
                {fleet.length === 0 ? (
                    <div className="empty-fleet glass">
                        <span style={{ fontSize: '3rem', opacity: 0.3 }}>🚛</span>
                        <p>Your fleet is empty. Add your first vehicle to start tracking organizational performance.</p>
                    </div>
                ) : (
                    fleet.map(vehicle => (
                        <div key={vehicle.id} className="vehicle-card glass">
                            <div className="v-icon">
                                {vehicle.type === 'truck' ? '🚛' : vehicle.type === 'bus' ? '🚌' : vehicle.type === 'ev' ? '⚡' : '🚗'}
                            </div>
                            <div className="v-info">
                                <div className="v-name">{vehicle.name} <span className="v-reg">{vehicle.regNo}</span></div>
                                <div className="v-meta">
                                    <span>{vehicle.type.toUpperCase()}</span> •
                                    <span>{vehicle.fuelType.toUpperCase()}</span> •
                                    <span>{vehicle.efficiency} {vehicle.fuelType === 'electric' ? 'kWh' : 'L'}/100km</span>
                                </div>
                            </div>
                            <button className="v-remove" onClick={() => removeVehicle(vehicle.id)}>🗑️</button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
