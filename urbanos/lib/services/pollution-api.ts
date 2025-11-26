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

/**
 * Pollution trend interface
 */
export interface PollutionTrend {
  current: number;
  previous: number;
  change: number; // percentage
  direction: 'up' | 'down' | 'stable';
  period: 'hour' | 'day' | 'week';
}

/**
 * Calculate trend between two values
 */
export function calculateTrend(
  current: number,
  previous: number,
  period: 'hour' | 'day' | 'week' = 'day'
): PollutionTrend {
  const change = previous === 0 ? 0 : ((current - previous) / previous) * 100;
  const direction: 'up' | 'down' | 'stable' = 
    Math.abs(change) < 1 ? 'stable' : change > 0 ? 'up' : 'down';
  
  return {
    current,
    previous,
    change: Math.abs(change),
    direction,
    period,
  };
}

/**
 * Get historical data grouped by time period
 */
export function getHistoricalData(
  data: Array<{ timestamp: string; aqi_value?: number | null; level: number }>,
  period: 'hour' | 'day' = 'hour'
): Array<{ time: string; aqi: number }> {
  const grouped = new Map<string, number[]>();
  
  data.forEach((item) => {
    const date = new Date(item.timestamp);
    let key: string;
    
    if (period === 'hour') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:00:00`;
    } else {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    }
    
    const aqi = item.aqi_value || item.level;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(aqi);
  });
  
  return Array.from(grouped.entries())
    .map(([time, values]) => ({
      time,
      aqi: values.reduce((sum, val) => sum + val, 0) / values.length,
    }))
    .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
}

/**
 * Compare two time periods
 */
export function comparePeriods(
  currentData: Array<{ timestamp: string; aqi_value?: number | null; level: number }>,
  previousData: Array<{ timestamp: string; aqi_value?: number | null; level: number }>
): PollutionTrend {
  const currentAvg = currentData.length > 0
    ? currentData.reduce((sum, item) => sum + (item.aqi_value || item.level), 0) / currentData.length
    : 0;
  
  const previousAvg = previousData.length > 0
    ? previousData.reduce((sum, item) => sum + (item.aqi_value || item.level), 0) / previousData.length
    : 0;
  
  return calculateTrend(currentAvg, previousAvg, 'day');
}

/**
 * Get peak pollution time from hourly data
 */
export function getPeakPollutionTime(
  hourlyData: Array<{ time: string; aqi: number }>
): { hour: number; aqi: number } | null {
  if (hourlyData.length === 0) return null;
  
  const peak = hourlyData.reduce((max, item) => 
    item.aqi > max.aqi ? item : max
  );
  
  const hour = new Date(peak.time).getHours();
  return { hour, aqi: peak.aqi };
}

