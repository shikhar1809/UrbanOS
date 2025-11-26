'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation } from 'lucide-react';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationPickerProps {
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}

// Reverse geocoding function using OpenStreetMap Nominatim API
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'UrbanOS/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      // Build address string from most specific to least specific
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
      
      // Fallback to display_name if address parts are empty
      if (data.display_name) {
        return data.display_name;
      }
    }
    
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    // Fallback to coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

function LocationMarker({ onLocationSelect, position, setPosition, isGeocoding, setIsGeocoding }: LocationPickerProps & { position: L.LatLng | null; setPosition: (pos: L.LatLng | null) => void; isGeocoding: boolean; setIsGeocoding: (val: boolean) => void }) {
  const map = useMapEvents({
    async click(e) {
      setPosition(e.latlng);
      setIsGeocoding(true);
      
      // Get address using reverse geocoding
      const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      setIsGeocoding(false);
      
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        address,
      });
    },
  });

  return position === null ? null : <Marker position={position} />;
}

function LocationEventHandler({ onLocationSelect, setPosition, setIsGeocoding }: LocationPickerProps & { setPosition: (pos: L.LatLng | null) => void; setIsGeocoding: (val: boolean) => void }) {
  const map = useMapEvents({});

  useEffect(() => {
    const handleLocationFound = async (e: L.LocationEvent) => {
      setPosition(e.latlng);
      map.flyTo(e.latlng, 15);
      setIsGeocoding(true);
      
      // Get address using reverse geocoding
      const address = await reverseGeocode(e.latlng.lat, e.latlng.lng);
      setIsGeocoding(false);
      
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        address,
      });
    };

    map.on('locationfound', handleLocationFound);

    return () => {
      map.off('locationfound', handleLocationFound);
    };
  }, [map, onLocationSelect, setPosition, setIsGeocoding]);

  return null;
}

// Component that uses useMap hook to get map instance
function GetLocationButton({ isLocating, setIsLocating, onLocationSelect }: { 
  isLocating: boolean; 
  setIsLocating: (val: boolean) => void;
  onLocationSelect: (location: { lat: number; lng: number; address: string }) => void;
}) {
  const map = useMap();

  const handleGetLocation = async () => {
    if (!map) {
      alert('Map is not ready. Please wait a moment and try again.');
      return;
    }

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser. Please select a location on the map.');
      return;
    }

    setIsLocating(true);
    
    // Use browser's geolocation API directly instead of Leaflet's locate
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setIsLocating(false);
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        
        // Center map on user's location
        map.setView([lat, lng], 15, {
          animate: true,
          duration: 0.5,
        });
        
        // Get address from coordinates
        try {
          const address = await reverseGeocode(lat, lng);
          onLocationSelect({ lat, lng, address });
        } catch (error) {
          console.error('Reverse geocoding failed:', error);
          // Still set location even if reverse geocoding fails
          onLocationSelect({ 
            lat, 
            lng, 
            address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` 
          });
        }
      },
      (error) => {
        setIsLocating(false);
        
        let errorMessage = 'Unable to get your location. ';
        
        if (error.code === 1) {
          errorMessage += 'Location access was denied. Please enable location permissions in your browser settings or select a location on the map.';
        } else if (error.code === 2) {
          errorMessage += 'Location information is unavailable. Please select a location on the map.';
        } else if (error.code === 3) {
          errorMessage += 'Location request timed out. Please try again or select a location on the map.';
        } else {
          errorMessage += 'An unknown error occurred. Please select a location on the map.';
        }
        
        alert(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  return (
    <button
      type="button"
      onClick={handleGetLocation}
      disabled={isLocating || !map}
      className="absolute top-2 right-2 z-[1000] bg-windows-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-windows-blue-hover transition-colors flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Navigation className={`w-4 h-4 ${isLocating ? 'animate-spin' : ''}`} />
      {isLocating ? 'Locating...' : 'Get My Location'}
    </button>
  );
}


export default function LocationPicker({ onLocationSelect }: LocationPickerProps) {
  const defaultCenter: [number, number] = [26.8467, 80.9462]; // Lucknow, India
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  return (
    <div className="w-full h-64 rounded-lg overflow-hidden border border-foreground/20 relative">
      <MapContainer
        center={defaultCenter}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker 
          onLocationSelect={onLocationSelect} 
          position={position}
          setPosition={setPosition}
          isGeocoding={isGeocoding}
          setIsGeocoding={setIsGeocoding}
        />
        <LocationEventHandler 
          onLocationSelect={onLocationSelect}
          setPosition={setPosition}
          setIsGeocoding={setIsGeocoding}
        />
        <GetLocationButton 
          isLocating={isLocating}
          setIsLocating={setIsLocating}
          onLocationSelect={onLocationSelect}
        />
      </MapContainer>
      {isGeocoding && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white/95 backdrop-blur-sm px-4 py-2 rounded-lg shadow-lg text-sm font-medium">
          Getting address...
        </div>
      )}
      <div className="absolute bottom-2 left-2 z-[1000] bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg text-xs text-foreground/70 shadow-lg">
        <MapPin className="w-3 h-3 inline mr-1" />
        Click on the map to place a pin
      </div>
    </div>
  );
}

