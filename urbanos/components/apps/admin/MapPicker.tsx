'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapPickerProps {
  location: { lat: number; lng: number; address: string } | null;
  onLocationChange: (location: { lat: number; lng: number; address: string } | null) => void;
}

// Reverse geocoding function using OpenStreetMap Nominatim API
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'UrbanOS/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      const addressParts: string[] = [];
      
      if (addr.house_number && addr.road) {
        addressParts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        addressParts.push(addr.road);
      }
      
      if (addr.neighbourhood || addr.suburb) {
        addressParts.push(addr.neighbourhood || addr.suburb);
      }
      
      if (addr.city || addr.town || addr.village) {
        addressParts.push(addr.city || addr.town || addr.village);
      }
      
      if (addr.state_district && !addressParts.includes(addr.state_district)) {
        addressParts.push(addr.state_district);
      }
      
      if (addr.state) {
        addressParts.push(addr.state);
      }
      
      if (addr.postcode) {
        addressParts.push(addr.postcode);
      }
      
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
      
      if (data.display_name) {
        return data.display_name;
      }
    }
    
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

function LocationMarker({ 
  onLocationChange, 
  position, 
  setPosition, 
  isGeocoding, 
  setIsGeocoding 
}: MapPickerProps & { 
  position: L.LatLng | null; 
  setPosition: (pos: L.LatLng | null) => void; 
  isGeocoding: boolean; 
  setIsGeocoding: (val: boolean) => void 
}) {
  const map = useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      setIsGeocoding(true);
      
      const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      setIsGeocoding(false);
      
      onLocationChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        address,
      });
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function MapController({ location, setPosition }: { location: { lat: number; lng: number; address: string } | null; setPosition: (pos: L.LatLng | null) => void }) {
  const map = useMap();

  useEffect(() => {
    if (location && map) {
      const latlng = L.latLng(location.lat, location.lng);
      setPosition(latlng);
      map.setView(latlng, 15);
    }
  }, [location, map, setPosition]);

  return null;
}

export default function MapPicker({ location, onLocationChange }: MapPickerProps) {
  const defaultCenter: [number, number] = location 
    ? [location.lat, location.lng] 
    : [26.8467, 80.9462]; // Default to Lucknow
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden neo-border relative">
      <MapContainer
        center={defaultCenter}
        zoom={location ? 15 : 13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          onLocationChange={onLocationChange} 
          position={position}
          setPosition={setPosition}
          isGeocoding={isGeocoding}
          setIsGeocoding={setIsGeocoding}
        />
        <MapController location={location} setPosition={setPosition} />
      </MapContainer>
      {isGeocoding && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm font-medium neo-border">
          Getting address...
        </div>
      )}
      {location && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-white dark:bg-windows-dark border-t border-black">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="w-4 h-4" />
            <span className="font-medium">{location.address}</span>
          </div>
        </div>
      )}
    </div>
  );
}

