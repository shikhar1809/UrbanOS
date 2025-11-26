import { NextResponse } from 'next/server';

// Cache duration in seconds (30 minutes)
const CACHE_DURATION = 1800;

export async function GET() {
  try {
    // Use data.gov.in API for real-time air quality in Lucknow, India
    const apiKey = process.env.DATA_GOV_IN_API_KEY || '579b464db66ec23bdd0000019779c845298b477271ef862e22055b68';
    const resourceId = '3b01bcb8-0b14-4abf-b6f2-c1bfd384ba69';
    
    // data.gov.in API - Real-time air quality for Lucknow
    const response = await fetch(
      `https://api.data.gov.in/resource/${resourceId}?api-key=${apiKey}&format=json&limit=1&filters[city]=Lucknow`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: CACHE_DURATION },
      }
    );

    if (!response.ok) {
      throw new Error(`Air Quality API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse data.gov.in API response
    // The API returns data in records array
    if (!data.records || data.records.length === 0) {
      throw new Error('No air quality data found for Lucknow');
    }

    const record = data.records[0];
    
    // Extract air quality data from the record
    // Common fields: aqi, pm25, pm10, no2, so2, co, o3, etc.
    const aqi = parseInt(record.aqi || record.aqi_value || record.air_quality_index || '0');
    const pm25 = parseFloat(record.pm25 || record.pm2_5 || record['pm2.5'] || '0');
    const pm10 = parseFloat(record.pm10 || record['pm10'] || '0');
    const no2 = parseFloat(record.no2 || record['no2'] || '0');
    const so2 = parseFloat(record.so2 || record['so2'] || '0');
    const co = parseFloat(record.co || record['co'] || '0');
    const o3 = parseFloat(record.o3 || record['o3'] || '0');
    
    // Get AQI level
    const aqiLevel = getAQILevel(aqi);
    
    const nextResponse = NextResponse.json({
      aqi: aqi,
      pm25: Math.round(pm25 * 10) / 10,
      pm10: Math.round(pm10 * 10) / 10,
      no2: Math.round(no2 * 10) / 10,
      so2: Math.round(so2 * 10) / 10,
      co: Math.round(co * 10) / 10,
      o3: Math.round(o3 * 10) / 10,
      level: aqiLevel.level,
      color: aqiLevel.color,
      description: aqiLevel.description,
      city: record.city || 'Lucknow',
      timestamp: record.timestamp || record.date || new Date().toISOString(),
    });

    // Add cache headers for client-side caching
    nextResponse.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`);
    
    return nextResponse;
  } catch (error) {
    // Only log errors (not sensitive data)
    console.error('Air Quality API error');
    
    // Return default air quality data on error with shorter cache
    const errorResponse = NextResponse.json({
      aqi: 50,
      pm25: 0,
      pm10: 0,
      no2: 0,
      so2: 0,
      co: 0,
      o3: 0,
      level: 'Good',
      color: '#10b981',
      description: 'Air quality is satisfactory',
      city: 'Lucknow',
      timestamp: new Date().toISOString(),
    });

    // Shorter cache for error responses
    errorResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return errorResponse;
  }
}

function getAQILevel(aqi: number): {
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

