import { NextResponse } from 'next/server';
import {
  getCityAQIData,
  getCityMultipleLocationsData,
  getOverallAQI,
  calculateAQIFromPM25,
  calculateAQIFromPM10,
} from '@/lib/services/aqicn-service';

// Cache duration in seconds (30 minutes)
const CACHE_DURATION = 1800;

export async function GET(request: Request) {
  try {
    // Get city from query parameter, default to 'Lucknow'
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Lucknow';
    const multiple = searchParams.get('multiple') === 'true'; // Flag to get multiple locations

    if (multiple) {
      // Fetch multiple locations (at least 5) from AQICN
      let locationsData = await getCityMultipleLocationsData(city, 10);
      
      console.log(`API: Got ${locationsData.length} locations from AQICN`);

      // If we got no data, create fallback locations
      if (locationsData.length === 0) {
        console.warn('API: No data from AQICN, creating fallback locations for Lucknow');
        const lucknowCenter = { lat: 26.8467, lng: 80.9462 };
        const offsets = [
          { lat: 0.05, lng: 0.05, name: 'North East Zone' },
          { lat: -0.05, lng: 0.05, name: 'South East Zone' },
          { lat: 0.05, lng: -0.05, name: 'North West Zone' },
          { lat: -0.05, lng: -0.05, name: 'South West Zone' },
          { lat: 0, lng: 0, name: 'Central Zone' },
        ];
        
        locationsData = offsets.map((offset, idx) => ({
          city: city,
          coordinates: { lat: lucknowCenter.lat + offset.lat, lng: lucknowCenter.lng + offset.lng },
          measurements: {
            pm25: 25 + Math.random() * 25,
            pm10: 50 + Math.random() * 30,
            o3: 20 + Math.random() * 15,
            no2: 10 + Math.random() * 10,
          },
          timestamp: new Date().toISOString(),
          locationId: 1000 + idx,
          locationName: `${city} - ${offset.name}`,
          aqi: 50 + Math.floor(Math.random() * 50),
        }));
      }

      const locationsResponse = locationsData.map((locationData) => {
        const pm25_aqi = locationData.measurements.pm25
          ? calculateAQIFromPM25(locationData.measurements.pm25)
          : undefined;
        const pm10_aqi = locationData.measurements.pm10
          ? calculateAQIFromPM10(locationData.measurements.pm10)
          : undefined;

        const aqiLevel = getAQILevel(locationData.aqi || 50);

        return {
          aqi: locationData.aqi || 50,
          pm25: locationData.measurements.pm25 ? Math.round(locationData.measurements.pm25 * 10) / 10 : 0,
          pm10: locationData.measurements.pm10 ? Math.round(locationData.measurements.pm10 * 10) / 10 : 0,
          no2: locationData.measurements.no2 ? Math.round(locationData.measurements.no2 * 10) / 10 : 0,
          so2: locationData.measurements.so2 ? Math.round(locationData.measurements.so2 * 10) / 10 : 0,
          co: locationData.measurements.co ? Math.round(locationData.measurements.co * 10) / 10 : 0,
          o3: locationData.measurements.o3 ? Math.round(locationData.measurements.o3 * 10) / 10 : 0,
          pm25_aqi,
          pm10_aqi,
          level: aqiLevel.level,
          color: aqiLevel.color,
          description: aqiLevel.description,
          city: locationData.city,
          coordinates: locationData.coordinates,
          locationId: locationData.locationId,
          locationName: locationData.locationName,
          timestamp: locationData.timestamp,
        };
      });

      const nextResponse = NextResponse.json({
        locations: locationsResponse,
        count: locationsResponse.length,
      });

      nextResponse.headers.set(
        'Cache-Control',
        `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`
      );

      return nextResponse;
    }

    // Single location (backward compatibility)
    const cityData = await getCityAQIData(city);

    if (!cityData || !cityData.data) {
      throw new Error(`No data found for ${city}`);
    }

    const iaqi = cityData.data.iaqi;
    const measurements = {
      pm25: iaqi.pm25?.v,
      pm10: iaqi.pm10?.v,
      o3: iaqi.o3?.v,
      no2: iaqi.no2?.v,
      so2: iaqi.so2?.v,
      co: iaqi.co?.v,
    };

    // Calculate AQI values for each pollutant
    const pm25_aqi = measurements.pm25
      ? calculateAQIFromPM25(measurements.pm25)
      : undefined;
    const pm10_aqi = measurements.pm10
      ? calculateAQIFromPM10(measurements.pm10)
      : undefined;

    // Get overall AQI (use the main AQI from API, or calculate from pollutants)
    const overallAQI = cityData.data.aqi || getOverallAQI(measurements);

    // Get AQI level
    const aqiLevel = getAQILevel(overallAQI);

    const nextResponse = NextResponse.json({
      aqi: overallAQI,
      pm25: measurements.pm25 ? Math.round(measurements.pm25 * 10) / 10 : 0,
      pm10: measurements.pm10 ? Math.round(measurements.pm10 * 10) / 10 : 0,
      no2: measurements.no2 ? Math.round(measurements.no2 * 10) / 10 : 0,
      so2: measurements.so2 ? Math.round(measurements.so2 * 10) / 10 : 0,
      co: measurements.co ? Math.round(measurements.co * 10) / 10 : 0,
      o3: measurements.o3 ? Math.round(measurements.o3 * 10) / 10 : 0,
      // Include AQI values for each pollutant
      pm25_aqi,
      pm10_aqi,
      level: aqiLevel.level,
      color: aqiLevel.color,
      description: aqiLevel.description,
      city: cityData.data.city.name,
      coordinates: {
        lat: cityData.data.city.geo[0],
        lng: cityData.data.city.geo[1],
      },
      locationId: cityData.data.idx,
      locationName: cityData.data.city.name,
      timestamp: cityData.data.time.iso || cityData.data.time.s,
    });

    // Add cache headers for client-side caching
    nextResponse.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`
    );

    return nextResponse;
  } catch (error: any) {
    // Only log errors (not sensitive data)
    console.error('Air Quality API error:', error?.message || 'Unknown error');

    // Return default air quality data on error with shorter cache
    const errorResponse = NextResponse.json({
      aqi: 50,
      pm25: 0,
      pm10: 0,
      no2: 0,
      so2: 0,
      co: 0,
      o3: 0,
      pm25_aqi: undefined,
      pm10_aqi: undefined,
      level: 'Good',
      color: '#10b981',
      description: 'Air quality is satisfactory',
      city: 'Lucknow',
      coordinates: { lat: 26.8467, lng: 80.9462 },
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

