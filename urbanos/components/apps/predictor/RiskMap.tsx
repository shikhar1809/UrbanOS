'use client';

import { MapContainer, TileLayer, Circle, Marker, Popup } from 'react-leaflet';
import { RiskZone, HistoricalIncident } from '@/types';
import L from 'leaflet';

interface RiskMapProps {
  riskZones: RiskZone[];
  incidents: HistoricalIncident[];
}

const getRiskColor = (level: 'low' | 'medium' | 'high') => {
  switch (level) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
    default:
      return '#6b7280';
  }
};

export default function RiskMap({ riskZones, incidents }: RiskMapProps) {
  // Default center - Lucknow, India
  const defaultCenter: [number, number] = [26.8467, 80.9462]; // Lucknow

  // Calculate center based on zones, but fallback to Lucknow
  const center: [number, number] =
    riskZones.length > 0
      ? [
          riskZones.reduce((sum, z) => sum + z.location.lat, 0) / riskZones.length,
          riskZones.reduce((sum, z) => sum + z.location.lng, 0) / riskZones.length,
        ]
      : defaultCenter;

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-foreground/20">
      <MapContainer
        center={center}
        zoom={riskZones.length > 0 ? 12 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Risk Zones */}
        {riskZones.map((zone, index) => (
          <Circle
            key={`zone-${index}`}
            center={[zone.location.lat, zone.location.lng]}
            radius={zone.radius * 111320} // Convert degrees to meters (approximate)
            pathOptions={{
              color: getRiskColor(zone.risk_level),
              fillColor: getRiskColor(zone.risk_level),
              fillOpacity: 0.2,
              weight: 2,
            }}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold mb-1">{zone.risk_level.toUpperCase()} Risk Zone</h4>
                <p className="text-sm mb-1">{zone.incident_count} incidents</p>
                <p className="text-sm text-gray-600">Types: {zone.predicted_issues.join(', ')}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Individual Incidents (show only recent ones to avoid clutter) */}
        {incidents.slice(0, 50).map((incident) => (
          <Marker
            key={incident.id}
            position={[incident.location.lat, incident.location.lng]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="width: 8px; height: 8px; background-color: ${
                incident.severity === 'high' ? '#ef4444' : incident.severity === 'medium' ? '#f59e0b' : '#10b981'
              }; border-radius: 50%; border: 2px solid white;"></div>`,
              iconSize: [12, 12],
            })}
          >
            <Popup>
              <div className="p-2">
                <h4 className="font-semibold capitalize mb-1">{incident.type}</h4>
                <p className="text-sm text-gray-600">
                  {new Date(incident.occurred_at).toLocaleDateString()}
                </p>
                <p className="text-sm capitalize">Severity: {incident.severity}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

