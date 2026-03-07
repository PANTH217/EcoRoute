import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';


// Fix for default marker icons in React-Leaflet
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

const ROUTE_COLORS = ['#00e676', '#64b5f6', '#ffb74d', '#ce93d8'];

function ChangeView({ bounds }) {
    const map = useMap();
    if (bounds) map.fitBounds(bounds, { padding: [50, 50] });
    return null;
}

export default function MapView({ routes, selectedRoute, origin, destination }) {

    // Convert OSRM polyline (Encoded Polyline Algorithm) to LatLng arrays
    const decodePolyline = (str, precision = 5) => {
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
    };

    const allRoutePaths = routes.map(route => ({
        id: route.id,
        rank: route.rank,
        positions: decodePolyline(route.polyline)
    }));

    // Calculate bounds to fit all routes
    const bounds = allRoutePaths.length > 0
        ? L.latLngBounds(allRoutePaths.flatMap(r => r.positions))
        : null;

    return (
        <div className="map-container">
            <MapContainer
                center={[20.5937, 78.9629]}
                zoom={5}
                scrollWheelZoom={true}
                className="map-canvas"
                style={{ background: '#1a1a2e' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />

                {allRoutePaths.map((routePath) => {
                    const isSelected = routePath.id === selectedRoute;
                    const isWinner = routePath.rank === 1;
                    const color = isWinner ? ROUTE_COLORS[0] : ROUTE_COLORS[routePath.id % ROUTE_COLORS.length];

                    return (
                        <Polyline
                            key={routePath.id}
                            positions={routePath.positions}
                            pathOptions={{
                                color: color,
                                weight: isSelected || isWinner ? 5 : 3,
                                opacity: isSelected || isWinner ? 0.95 : 0.35,
                            }}
                            eventHandlers={{
                                click: () => console.log('Route clicked:', routePath.id)
                            }}
                        />
                    );
                })}

                {origin && <Marker position={origin}><Popup>Origin</Popup></Marker>}
                {destination && <Marker position={destination}><Popup>Destination</Popup></Marker>}

                <ChangeView bounds={bounds} />

            </MapContainer>

            {routes.length === 0 && (
                <div className="map-placeholder">
                    <div className="map-placeholder-inner">
                        <span className="map-icon">🗺️</span>
                        <p>Enter origin & destination to see eco routes</p>
                    </div>
                </div>
            )}
        </div>
    );
}
