/**
 * OpenAQ API v3 Service
 * Documentation: 
 * - Quick Start: https://docs.openaq.org/using-the-api/quick-start
 * - Geospatial Queries: https://docs.openaq.org/using-the-api/geospatial
 * - Dates & Datetimes: https://docs.openaq.org/using-the-api/dates-datetimes
 */

const OPENAQ_API_BASE = 'https://api.openaq.org/v3';
const OPENAQ_API_KEY = process.env.OPENAQ_API_KEY || 'bad4d9bb683310da51f64d700e8696a882395e0bce191bb4836310a80e12a205';

export interface OpenAQLocation {
  id: number;
  name: string;
  locality?: string;
  timezone: string;
  country: {
    id: number;
    code: string;
    name: string;
  };
  coordinates: {
    latitude: number;
    longitude: number;
  };
  sensors: Array<{
    id: number;
    name: string;
    parameter: {
      id: number;
      name: string;
      units: string;
      displayName: string;
    };
  }>;
}

export interface OpenAQMeasurement {
  parameter: string;
  value: number;
  unit: string;
  lastUpdated: string;
  locationId: number;
  location: string;
}

export interface OpenAQLatestResponse {
  meta: {
    name: string;
    website: string;
    page: number;
    limit: number;
    found: number;
  };
  results: Array<{
    locationId: number;
    location: string;
    parameter: string;
    value: number;
    unit: string;
    date: {
      utc: string;
      local: string;
    };
    coordinates: {
      latitude: number;
      longitude: number;
    };
    country: string;
    city?: string;
  }>;
}

/**
 * Search for locations by city name
 * According to OpenAQ examples: https://docs.openaq.org/examples/examples
 */
export async function searchLocationsByCity(cityName: string, limit: number = 1000): Promise<OpenAQLocation[]> {
  try {
    const response = await fetch(
      `${OPENAQ_API_BASE}/locations?city=${encodeURIComponent(cityName)}&limit=${limit}`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error searching OpenAQ locations:', error);
    return [];
  }
}

/**
 * Get latest PM2.5 values for all locations in an area
 * According to OpenAQ examples: https://docs.openaq.org/examples/examples
 * Uses /v3/parameters/2/latest endpoint (parameter 2 = PM2.5)
 */
export async function getLatestPM25ByCoordinates(
  lat: number,
  lng: number,
  radius: number = 25000
): Promise<OpenAQLatestResponse> {
  try {
    const validRadius = Math.min(radius, 25000);
    
    // Get latest PM2.5 values using parameters endpoint
    const response = await fetch(
      `${OPENAQ_API_BASE}/parameters/2/latest?coordinates=${lat},${lng}&radius=${validRadius}&limit=1000`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching latest PM2.5 by coordinates:', error);
    throw error;
  }
}

/**
 * Get latest measurements for a location
 */
export async function getLatestMeasurements(locationId: number): Promise<OpenAQLatestResponse> {
  try {
    const response = await fetch(
      `${OPENAQ_API_BASE}/locations/${locationId}/latest`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching latest measurements:', error);
    throw error;
  }
}

/**
 * Find locations near a point using coordinates and radius
 * According to OpenAQ examples: https://docs.openaq.org/examples/examples
 * Format: coordinates=lat,lng (latitude,longitude)
 * radius: in meters, maximum 25,000 (25km)
 */
export async function findLocationsByCoordinates(
  lat: number,
  lng: number,
  radius: number = 25000 // meters, default 25km (max allowed)
): Promise<{ results: OpenAQLocation[] }> {
  try {
    // Ensure radius doesn't exceed maximum
    const validRadius = Math.min(radius, 25000);
    
    // Format: coordinates=lat,lng (latitude,longitude) - per examples docs
    const response = await fetch(
      `${OPENAQ_API_BASE}/locations?coordinates=${lat},${lng}&radius=${validRadius}&limit=1000`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding locations by coordinates:', error);
    throw error;
  }
}

/**
 * Get latest measurements by coordinates - finds locations first, then gets their latest data
 * According to OpenAQ examples: https://docs.openaq.org/examples/examples
 */
export async function getLatestMeasurementsByCoordinates(
  lat: number,
  lng: number,
  radius: number = 25000
): Promise<OpenAQLatestResponse> {
  try {
    // First, find all locations in the area
    const locationsResponse = await findLocationsByCoordinates(lat, lng, radius);
    
    if (!locationsResponse.results || locationsResponse.results.length === 0) {
      return { meta: { name: 'openaq-api', website: '/', page: 1, limit: 100, found: 0 }, results: [] };
    }

    // Get latest measurements for each location
    const allMeasurements: OpenAQLatestResponse['results'] = [];
    
    for (const location of locationsResponse.results.slice(0, 50)) { // Limit to 50 locations
      try {
        const latestData = await getLatestMeasurements(location.id);
        if (latestData.results && latestData.results.length > 0) {
          allMeasurements.push(...latestData.results);
        }
      } catch (error) {
        console.warn(`Error fetching latest for location ${location.id}:`, error);
        // Continue with other locations
      }
    }

    return {
      meta: {
        name: 'openaq-api',
        website: '/',
        page: 1,
        limit: 100,
        found: allMeasurements.length,
      },
      results: allMeasurements,
    };
  } catch (error) {
    console.error('Error fetching latest measurements by coordinates:', error);
    throw error;
  }
}

/**
 * Find locations in a bounding box
 * According to OpenAQ examples: https://docs.openaq.org/examples/examples
 * bbox format: minX,minY,maxX,maxY (minimum longitude, minimum latitude, maximum longitude, maximum latitude)
 */
export async function findLocationsByBoundingBox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): Promise<{ results: OpenAQLocation[] }> {
  try {
    // Validate coordinates are within WGS84 bounds
    if (minLng < -180 || maxLng > 180 || minLat < -90 || maxLat > 90) {
      throw new Error('Coordinates outside WGS84 bounds (-180,-90,180,90)');
    }

    // Format: bbox=minLng,minLat,maxLng,maxLat - per examples docs
    const response = await fetch(
      `${OPENAQ_API_BASE}/locations?bbox=${minLng},${minLat},${maxLng},${maxLat}&limit=1000`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding locations by bounding box:', error);
    throw error;
  }
}

/**
 * Get latest measurements using bounding box - finds locations first, then gets their latest data
 * According to OpenAQ examples: https://docs.openaq.org/examples/examples
 */
export async function getLatestMeasurementsByBoundingBox(
  minLng: number,
  minLat: number,
  maxLng: number,
  maxLat: number
): Promise<OpenAQLatestResponse> {
  try {
    // First, find all locations in the bounding box
    const locationsResponse = await findLocationsByBoundingBox(minLng, minLat, maxLng, maxLat);
    
    if (!locationsResponse.results || locationsResponse.results.length === 0) {
      return { meta: { name: 'openaq-api', website: '/', page: 1, limit: 100, found: 0 }, results: [] };
    }

    console.log(`Found ${locationsResponse.results.length} locations in bounding box`);

    // Get latest measurements for each location
    const allMeasurements: OpenAQLatestResponse['results'] = [];
    
    // Process locations in parallel (but limit concurrent requests)
    const locationPromises = locationsResponse.results.slice(0, 50).map(async (location) => {
      try {
        const latestData = await getLatestMeasurements(location.id);
        if (latestData.results && latestData.results.length > 0) {
          return latestData.results;
        }
        return [];
      } catch (error) {
        console.warn(`Error fetching latest for location ${location.id} (${location.name}):`, error);
        return [];
      }
    });

    const resultsArrays = await Promise.all(locationPromises);
    resultsArrays.forEach(results => {
      if (results.length > 0) {
        allMeasurements.push(...results);
      }
    });

    console.log(`Retrieved latest measurements from ${allMeasurements.length} location-measurement pairs`);

    return {
      meta: {
        name: 'openaq-api',
        website: '/',
        page: 1,
        limit: 100,
        found: allMeasurements.length,
      },
      results: allMeasurements,
    };
  } catch (error) {
    console.error('Error fetching latest measurements by bounding box:', error);
    throw error;
  }
}

/**
 * Get latest measurements for a city using geospatial queries
 * Uses bounding box for city-wide coverage when available
 */
export async function getCityLatestMeasurements(cityName: string): Promise<{
  city: string;
  coordinates: { lat: number; lng: number };
  measurements: {
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
  };
  timestamp: string;
  locationId?: number;
  locationName?: string;
}> {
  try {
    // City-specific bounding boxes (WGS84 coordinates: minLng, minLat, maxLng, maxLat)
    const cityBoundingBoxes: Record<string, { minLng: number; minLat: number; maxLng: number; maxLat: number }> = {
      'Lucknow': { minLng: 80.7, minLat: 26.7, maxLng: 81.1, maxLat: 27.0 },
      'lucknow': { minLng: 80.7, minLat: 26.7, maxLng: 81.1, maxLat: 27.0 },
      'Delhi': { minLng: 77.0, minLat: 28.4, maxLng: 77.4, maxLat: 28.7 },
      'delhi': { minLng: 77.0, minLat: 28.4, maxLng: 77.4, maxLat: 28.7 },
      'Mumbai': { minLng: 72.7, minLat: 18.9, maxLng: 72.9, maxLat: 19.2 },
      'mumbai': { minLng: 72.7, minLat: 18.9, maxLng: 72.9, maxLat: 19.2 },
    };

    const cityKey = cityName.toLowerCase();
    let latestData: OpenAQLatestResponse;

    if (cityBoundingBoxes[cityKey]) {
      // Use bounding box for city-wide coverage - finds all locations first, then gets their latest data
      const bbox = cityBoundingBoxes[cityKey];
      console.log(`Using bounding box for ${cityName}:`, bbox);
      latestData = await getLatestMeasurementsByBoundingBox(
        bbox.minLng,
        bbox.minLat,
        bbox.maxLng,
        bbox.maxLat
      );
      console.log(`Retrieved ${latestData.results.length} measurements from bounding box query`);
    } else {
      // Fallback: Use point and radius (25km max) - finds locations first, then gets their latest data
      const defaultCoords = { lat: 26.8467, lng: 80.9462 };
      console.log(`Using point+radius for ${cityName}:`, defaultCoords, 'radius: 25000m');
      latestData = await getLatestMeasurementsByCoordinates(defaultCoords.lat, defaultCoords.lng, 25000);
      console.log(`Retrieved ${latestData.results.length} measurements from coordinates query`);
    }

    // Aggregate all measurements from the geospatial query
    // Use the first location's coordinates as the center point
    const firstResult = latestData.results[0];
    const coords = firstResult?.coordinates || { latitude: 26.8467, longitude: 80.9462 };

    return aggregateMeasurements(
      latestData,
      cityName,
      {
        lat: coords.latitude,
        lng: coords.longitude,
      },
      firstResult?.locationId,
      firstResult?.location || cityName
    );
  } catch (error) {
    console.error('Error getting city latest measurements:', error);
    throw error;
  }
}

/**
 * Get latest measurements for multiple locations in a city using geospatial queries
 * Uses bounding box for city-wide coverage (better than point+radius for rectangular cities)
 * According to OpenAQ docs: https://docs.openaq.org/using-the-api/geospatial
 */
export async function getCityMultipleLocationsMeasurements(
  cityName: string,
  maxLocations: number = 5
): Promise<Array<{
  city: string;
  coordinates: { lat: number; lng: number };
  measurements: {
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
  };
  timestamp: string;
  locationId: number;
  locationName: string;
  aqi?: number;
}>> {
  try {
    // City-specific bounding boxes (WGS84 coordinates: minLng, minLat, maxLng, maxLat)
    const cityBoundingBoxes: Record<string, { minLng: number; minLat: number; maxLng: number; maxLat: number }> = {
      'Lucknow': { minLng: 80.7, minLat: 26.7, maxLng: 81.1, maxLat: 27.0 },
      'lucknow': { minLng: 80.7, minLat: 26.7, maxLng: 81.1, maxLat: 27.0 },
      'Delhi': { minLng: 77.0, minLat: 28.4, maxLng: 77.4, maxLat: 28.7 },
      'delhi': { minLng: 77.0, minLat: 28.4, maxLng: 77.4, maxLat: 28.7 },
      'Mumbai': { minLng: 72.7, minLat: 18.9, maxLng: 72.9, maxLat: 19.2 },
      'mumbai': { minLng: 72.7, minLat: 18.9, maxLng: 72.9, maxLat: 19.2 },
    };

    // Get bounding box for the city, or use point+radius as fallback
    const cityKey = cityName.toLowerCase();
    let locationsResponse: { results: OpenAQLocation[] };

    if (cityBoundingBoxes[cityKey]) {
      // Use bounding box to find all locations - per OpenAQ examples
      const bbox = cityBoundingBoxes[cityKey];
      console.log(`Finding locations in bounding box for ${cityName}:`, bbox);
      locationsResponse = await findLocationsByBoundingBox(
        bbox.minLng,
        bbox.minLat,
        bbox.maxLng,
        bbox.maxLat
      );
    } else {
      // Fallback: Use point and radius (25km max) centered on city
      const defaultCoords = { lat: 26.8467, lng: 80.9462 };
      console.log(`Finding locations near point for ${cityName}:`, defaultCoords, 'radius: 25000m');
      locationsResponse = await findLocationsByCoordinates(defaultCoords.lat, defaultCoords.lng, 25000);
    }

    console.log(`Found ${locationsResponse.results.length} locations for ${cityName}`);

    if (locationsResponse.results.length === 0) {
      console.warn(`No locations found for ${cityName}. Trying city name search as fallback...`);
      // Fallback: Try searching by city name
      const cityLocations = await searchLocationsByCity(cityName, 1000);
      if (cityLocations.length > 0) {
        console.log(`Found ${cityLocations.length} locations by city name search`);
        locationsResponse.results = cityLocations;
      } else {
        console.error(`No locations found for ${cityName} using any method`);
        return [];
      }
    }

    // Get latest measurements for each location (process more than maxLocations to ensure we get enough)
    const locationsToProcess = locationsResponse.results.slice(0, Math.max(maxLocations * 2, 20));
    console.log(`Processing ${locationsToProcess.length} locations to get at least ${maxLocations} with data`);
    
    const results = await Promise.all(
      locationsToProcess.map(async (location, index) => {
        try {
          console.log(`Fetching latest data for location ${index + 1}/${locationsToProcess.length}: ${location.name} (ID: ${location.id})`);
          const latestData = await getLatestMeasurements(location.id);
          
          if (!latestData.results || latestData.results.length === 0) {
            console.warn(`No measurements found for location ${location.id} (${location.name})`);
            return null;
          }
          
          const aggregated = aggregateMeasurements(
            latestData,
            cityName,
            {
              lat: location.coordinates.latitude,
              lng: location.coordinates.longitude,
            },
            location.id,
            location.name
          );

          const aqi = getOverallAQI(aggregated.measurements);
          
          console.log(`✅ Got data for ${location.name}: AQI ${aqi}`);

          return {
            ...aggregated,
            locationId: location.id,
            locationName: location.name,
            aqi,
          };
        } catch (error) {
          console.error(`❌ Error fetching data for location ${location.id} (${location.name}):`, error);
          return null;
        }
      })
    );

    const validResults = results.filter((r): r is NonNullable<typeof r> => r !== null);
    console.log(`✅ Successfully retrieved data for ${validResults.length} locations`);
    
    // If we have fewer than maxLocations, try to get more
    if (validResults.length < maxLocations && locationsResponse.results.length > locationsToProcess.length) {
      console.log(`Only got ${validResults.length} locations, trying to get more...`);
      const additionalLocations = locationsResponse.results.slice(locationsToProcess.length, locationsToProcess.length + (maxLocations - validResults.length) * 2);
      
      const additionalResults = await Promise.all(
        additionalLocations.map(async (location) => {
          try {
            const latestData = await getLatestMeasurements(location.id);
            if (!latestData.results || latestData.results.length === 0) return null;
            
            const aggregated = aggregateMeasurements(
              latestData,
              cityName,
              {
                lat: location.coordinates.latitude,
                lng: location.coordinates.longitude,
              },
              location.id,
              location.name
            );

            const aqi = getOverallAQI(aggregated.measurements);
            return {
              ...aggregated,
              locationId: location.id,
              locationName: location.name,
              aqi,
            };
          } catch (error) {
            return null;
          }
        })
      );
      
      validResults.push(...additionalResults.filter((r): r is NonNullable<typeof r> => r !== null));
    }

    return validResults;

  } catch (error) {
    console.error('Error getting multiple city locations measurements:', error);
    throw error;
  }
}

/**
 * Aggregate measurements from OpenAQ response into a single object
 */
function aggregateMeasurements(
  data: OpenAQLatestResponse,
  cityName: string,
  coordinates: { lat: number; lng: number },
  locationId?: number,
  locationName?: string
): {
  city: string;
  coordinates: { lat: number; lng: number };
  measurements: {
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
  };
  timestamp: string;
  locationId?: number;
  locationName?: string;
} {
  const measurements: {
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
  } = {};

  let latestTimestamp = '';

  // Aggregate measurements by parameter
  data.results.forEach((result) => {
    const param = result.parameter.toLowerCase();
    const value = result.value;

    if (param === 'pm25' || param === 'pm2.5') {
      measurements.pm25 = value;
    } else if (param === 'pm10') {
      measurements.pm10 = value;
    } else if (param === 'o3') {
      measurements.o3 = value;
    } else if (param === 'no2') {
      measurements.no2 = value;
    } else if (param === 'so2') {
      measurements.so2 = value;
    } else if (param === 'co') {
      measurements.co = value;
    }

    // Track the latest timestamp
    if (result.date.utc > latestTimestamp) {
      latestTimestamp = result.date.utc;
    }
  });

  return {
    city: cityName,
    coordinates,
    measurements,
    timestamp: latestTimestamp || new Date().toISOString(),
    locationId,
    locationName,
  };
}

/**
 * Calculate AQI from PM2.5 value (US EPA standard)
 * Reference: https://www.airnow.gov/aqi/aqi-basics/
 */
export function calculateAQIFromPM25(pm25: number): number {
  // US EPA AQI calculation for PM2.5
  if (pm25 <= 12.0) {
    return Math.round(((50 - 0) / (12.0 - 0)) * (pm25 - 0) + 0);
  } else if (pm25 <= 35.4) {
    return Math.round(((100 - 51) / (35.4 - 12.1)) * (pm25 - 12.1) + 51);
  } else if (pm25 <= 55.4) {
    return Math.round(((150 - 101) / (55.4 - 35.5)) * (pm25 - 35.5) + 101);
  } else if (pm25 <= 150.4) {
    return Math.round(((200 - 151) / (150.4 - 55.5)) * (pm25 - 55.5) + 151);
  } else if (pm25 <= 250.4) {
    return Math.round(((300 - 201) / (250.4 - 150.5)) * (pm25 - 150.5) + 201);
  } else {
    return Math.round(((400 - 301) / (350.4 - 250.5)) * (pm25 - 250.5) + 301);
  }
}

/**
 * Calculate AQI from PM10 value (US EPA standard)
 */
export function calculateAQIFromPM10(pm10: number): number {
  if (pm10 <= 54) {
    return Math.round(((50 - 0) / (54 - 0)) * (pm10 - 0) + 0);
  } else if (pm10 <= 154) {
    return Math.round(((100 - 51) / (154 - 55)) * (pm10 - 55) + 51);
  } else if (pm10 <= 254) {
    return Math.round(((150 - 101) / (254 - 155)) * (pm10 - 155) + 101);
  } else if (pm10 <= 354) {
    return Math.round(((200 - 151) / (354 - 255)) * (pm10 - 255) + 151);
  } else if (pm10 <= 424) {
    return Math.round(((300 - 201) / (424 - 355)) * (pm10 - 355) + 201);
  } else {
    return Math.round(((400 - 301) / (504 - 425)) * (pm10 - 425) + 301);
  }
}

/**
 * Get overall AQI from multiple pollutants (uses the highest AQI)
 */
export function getOverallAQI(measurements: {
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
}): number {
  const aqis: number[] = [];

  if (measurements.pm25 !== undefined) {
    aqis.push(calculateAQIFromPM25(measurements.pm25));
  }
  if (measurements.pm10 !== undefined) {
    aqis.push(calculateAQIFromPM10(measurements.pm10));
  }
  // TODO: Add AQI calculations for O3, NO2, SO2, CO if needed

  // Return the highest AQI (worst air quality)
  return aqis.length > 0 ? Math.max(...aqis) : 50; // Default to 50 (Good) if no data
}

/**
 * Get historical measurements aggregated by day for a location
 * According to OpenAQ docs: https://docs.openaq.org/using-the-api/dates-datetimes
 * Uses the measurements endpoint with date_from and date_to parameters
 * Dates use ISO-8601 format: YYYY-MM-DD or YYYY-MM-DDTHH:MM:SSZ
 */
export async function getHistoricalMeasurementsByDay(
  locationId: number,
  dateFrom: string, // ISO-8601 format: YYYY-MM-DD
  dateTo: string
): Promise<Array<{
  date: string;
  pm25?: number;
  pm10?: number;
  o3?: number;
  no2?: number;
  so2?: number;
  co?: number;
  aqi?: number;
}>> {
  try {
    // Use the measurements endpoint - get all measurements for the date range
    // Then aggregate by day on our side
    const response = await fetch(
      `${OPENAQ_API_BASE}/locations/${locationId}/measurements?date_from=${dateFrom}&date_to=${dateTo}&limit=1000`,
      {
        headers: {
          'X-API-Key': OPENAQ_API_KEY,
        },
      }
    );

    if (!response.ok) {
      // If endpoint doesn't exist, return empty array (some locations may not have historical data)
      if (response.status === 404) {
        console.warn(`Historical data not available for location ${locationId}`);
        return [];
      }
      throw new Error(`OpenAQ API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Group by date and aggregate measurements
    const dateMap = new Map<string, {
      pm25?: number[];
      pm10?: number[];
      o3?: number[];
      no2?: number[];
      so2?: number[];
      co?: number[];
    }>();

    if (data.results) {
      data.results.forEach((result: any) => {
        // Extract date from datetime (dates represent start of period per OpenAQ docs)
        const date = result.date?.local?.split('T')[0] || result.date?.utc?.split('T')[0];
        if (!date) return;

        if (!dateMap.has(date)) {
          dateMap.set(date, {});
        }

        const dayData = dateMap.get(date)!;
        const param = result.parameter?.toLowerCase();
        const value = result.value;

        if (param === 'pm25' || param === 'pm2.5') {
          if (!dayData.pm25) dayData.pm25 = [];
          dayData.pm25.push(value);
        } else if (param === 'pm10') {
          if (!dayData.pm10) dayData.pm10 = [];
          dayData.pm10.push(value);
        } else if (param === 'o3') {
          if (!dayData.o3) dayData.o3 = [];
          dayData.o3.push(value);
        } else if (param === 'no2') {
          if (!dayData.no2) dayData.no2 = [];
          dayData.no2.push(value);
        } else if (param === 'so2') {
          if (!dayData.so2) dayData.so2 = [];
          dayData.so2.push(value);
        } else if (param === 'co') {
          if (!dayData.co) dayData.co = [];
          dayData.co.push(value);
        }
      });
    }

    // Convert to array and calculate averages and AQI
    return Array.from(dateMap.entries())
      .map(([date, measurements]) => {
        const avgMeasurements = {
          pm25: measurements.pm25 ? measurements.pm25.reduce((a, b) => a + b, 0) / measurements.pm25.length : undefined,
          pm10: measurements.pm10 ? measurements.pm10.reduce((a, b) => a + b, 0) / measurements.pm10.length : undefined,
          o3: measurements.o3 ? measurements.o3.reduce((a, b) => a + b, 0) / measurements.o3.length : undefined,
          no2: measurements.no2 ? measurements.no2.reduce((a, b) => a + b, 0) / measurements.no2.length : undefined,
          so2: measurements.so2 ? measurements.so2.reduce((a, b) => a + b, 0) / measurements.so2.length : undefined,
          co: measurements.co ? measurements.co.reduce((a, b) => a + b, 0) / measurements.co.length : undefined,
        };

        return {
          date,
          ...avgMeasurements,
          aqi: getOverallAQI(avgMeasurements),
        };
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error('Error fetching historical measurements:', error);
    // Return empty array instead of throwing to allow other locations to load
    return [];
  }
}

/**
 * Get historical measurements for multiple locations in a city (last 7 days)
 */
export async function getCityHistoricalData(
  cityName: string,
  days: number = 7
): Promise<Array<{
  locationId: number;
  locationName: string;
  coordinates: { lat: number; lng: number };
  dailyData: Array<{
    date: string;
    pm25?: number;
    pm10?: number;
    o3?: number;
    no2?: number;
    so2?: number;
    co?: number;
    aqi?: number;
  }>;
}>> {
  try {
    // Get locations for the city
    const locations = await getCityMultipleLocationsMeasurements(cityName, 5);
    
    if (locations.length === 0) {
      return [];
    }

    // Calculate date range (dates represent start of period per OpenAQ docs)
    const dateTo = new Date();
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() - days);
    
    // Format as ISO-8601: YYYY-MM-DD
    const dateFromStr = dateFrom.toISOString().split('T')[0];
    const dateToStr = dateTo.toISOString().split('T')[0];

    // Fetch historical data for each location
    const historicalData = await Promise.all(
      locations.map(async (location) => {
        try {
          const dailyData = await getHistoricalMeasurementsByDay(
            location.locationId,
            dateFromStr,
            dateToStr
          );

          return {
            locationId: location.locationId,
            locationName: location.locationName,
            coordinates: location.coordinates,
            dailyData,
          };
        } catch (error) {
          console.error(`Error fetching historical data for location ${location.locationId}:`, error);
          return null;
        }
      })
    );

    return historicalData.filter((d): d is NonNullable<typeof d> => d !== null);
  } catch (error) {
    console.error('Error getting city historical data:', error);
    throw error;
  }
}

