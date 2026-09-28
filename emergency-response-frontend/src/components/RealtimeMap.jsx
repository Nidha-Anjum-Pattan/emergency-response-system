import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon asset URLs in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom Icons
const victimIcon = L.divIcon({
  className: 'custom-map-icon victim-marker',
  html: '<div style="background-color: #ef4444; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(239,68,68,0.5); font-size: 16px;">🆘</div>',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
});

const ambulanceIcon = L.divIcon({
  className: 'custom-map-icon ambulance-marker',
  html: '<div style="background-color: #3b82f6; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(59,130,246,0.5); font-size: 18px;">🚑</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

const hospitalIcon = L.divIcon({
  className: 'custom-map-icon hospital-marker',
  html: '<div style="background-color: #10b981; width: 36px; height: 36px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 10px rgba(16,185,129,0.5); font-size: 18px;">🏥</div>',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

// Auto-center map bounds
function ChangeView({ bounds }) {
  const map = useMap();
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [bounds, map]);
  return null;
}

export default function RealtimeMap({ victimPos, ambulancePos, hospitalPos, height = "350px" }) {
  const defaultCenter = victimPos || ambulancePos || hospitalPos || [16.3067, 80.4365];
  const points = [];
  
  if (ambulancePos) points.push(ambulancePos);
  if (victimPos) points.push(victimPos);
  if (hospitalPos) points.push(hospitalPos);

  const polylineCoords = points;

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <MapContainer center={defaultCenter} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {points.length > 1 && <ChangeView bounds={points} />}

        {/* Victim Marker */}
        {victimPos && (
          <Marker position={victimPos} icon={victimIcon}>
            <Popup>
              <strong>🆘 Victim Emergency Location</strong>
            </Popup>
          </Marker>
        )}

        {/* Ambulance Marker */}
        {ambulancePos && (
          <Marker position={ambulancePos} icon={ambulanceIcon}>
            <Popup>
              <strong>🚑 Assigned Ambulance Unit</strong>
            </Popup>
          </Marker>
        )}

        {/* Hospital Marker */}
        {hospitalPos && (
          <Marker position={hospitalPos} icon={hospitalIcon}>
            <Popup>
              <strong>🏥 Target Hospital ER Bay</strong>
            </Popup>
          </Marker>
        )}

        {/* Real-time Route Polyline */}
        {polylineCoords.length >= 2 && (
          <Polyline positions={polylineCoords} color="#3b82f6" weight={4} dashArray="8, 8" />
        )}
      </MapContainer>
    </div>
  );
}
