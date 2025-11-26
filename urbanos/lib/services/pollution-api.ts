// AQI API integration using data.gov.in API
export interface AQIData {
  aqi: number;
  pm25?: { v: number; aqi?: number };
  pm10?: { v: number; aqi?: number };
  o3?: { v: number; aqi?: number };
  no2?: { v: number; aqi?: number };
  so2?: { v: number; aqi?: number };
  co?: { v: number; aqi?: number };
  city?: {
    geo: [number, number]; // [lat, lng]
    name: string;
  };
  time?: {
    s: string; // timestamp
  };
}

export interface AQIResponse {
  status: string;
  data?: AQIData;
}

/**
 * Fetch AQI data for a city from data.gov.in API (via our API route)
 * @param city - City name (e.g., 'lucknow', 'delhi')
 * @returns AQI data or null if error
 */
export async function fetchAQIData(city: string = 'lucknow'): Promise<AQIData | null> {
  try {
    // Use our API route to fetch air quality data (avoids CORS issues)
    const response = await fetch('/api/air-quality');
    
    if (!response.ok) {
      console.error('Air Quality API error:', response.status, response.statusText);
      return null;
    }
    
    const data = await response.json();
    
    // Transform our API response to match the expected AQIData format
    if (data && data.aqi !== undefined) {
      return {
        aqi: data.aqi,
        pm25: data.pm25 ? { v: data.pm25, aqi: data.aqi } : undefined,
        pm10: data.pm10 ? { v: data.pm10, aqi: data.aqi } : undefined,
        o3: data.o3 ? { v: data.o3, aqi: data.aqi } : undefined,
        no2: data.no2 ? { v: data.no2, aqi: data.aqi } : undefined,
        so2: data.so2 ? { v: data.so2, aqi: data.aqi } : undefined,
        co: data.co ? { v: data.co, aqi: data.aqi } : undefined,
        city: {
          geo: [26.8467, 80.9462], // Lucknow coordinates
          name: data.city || city,
        },
        time: {
          s: data.timestamp || new Date().toISOString(),
        },
      };
    }
    
    console.error('Air Quality API returned invalid data');
    return null;
  } catch (error) {
    console.error('Error fetching AQI data:', error);
    return null;
  }
}

/**
 * Get AQI level description based on AQI value
 */
export function getAQILevel(aqi: number): {
  level: string;
  color: string;
  description: string;
} {
  if (aqi <= 50) {
    return { level: 'Good', color: '#10b981', description: 'Air quality is satisfactory' };
  } else if (aqi <= 100) {
    return { level: 'Moderate', color: '#f59e0b', description: 'Acceptable air quality' };
  } else if (aqi <= 150) {
    return { level: 'Unhealthy for Sensitive Groups', color: '#f97316', description: 'Sensitive groups may experience effects' };
  } else if (aqi <= 200) {
    return { level: 'Unhealthy', color: '#ef4444', description: 'Everyone may experience health effects' };
  } else if (aqi <= 300) {
    return { level: 'Very Unhealthy', color: '#991b1b', description: 'Health warnings of emergency conditions' };
  } else {
    return { level: 'Hazardous', color: '#7f1d1d', description: 'Health alert: everyone may experience serious effects' };
  }
}

