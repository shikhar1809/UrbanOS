import { NextResponse } from 'next/server';
import { getCityAQIData, getHistoricalDataFromAQICN } from '@/lib/services/aqicn-service';

// Cache duration in seconds (1 hour for historical data)
const CACHE_DURATION = 3600;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city') || 'Lucknow';
    const days = parseInt(searchParams.get('days') || '7', 10);

    // Fetch current data from AQICN (includes forecast data)
    const cityData = await getCityAQIData(city);

    if (!cityData || !cityData.data) {
      throw new Error(`No data found for ${city}`);
    }

    // Extract historical/forecast data from the response
    const historicalData = getHistoricalDataFromAQICN(cityData);

    // Format response to match expected structure
    const locations = [{
      locationId: cityData.data.idx,
      locationName: cityData.data.city.name,
      coordinates: {
        lat: cityData.data.city.geo[0],
        lng: cityData.data.city.geo[1],
      },
      dailyData: historicalData,
    }];

    const nextResponse = NextResponse.json({
      city,
      days,
      locations,
      count: locations.length,
    });

    // Add cache headers
    nextResponse.headers.set(
      'Cache-Control',
      `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`
    );

    return nextResponse;
  } catch (error: any) {
    console.error('Historical Air Quality API error:', error?.message || 'Unknown error');

    const errorResponse = NextResponse.json({
      city: 'Lucknow',
      days: 7,
      locations: [],
      count: 0,
      error: error?.message || 'Failed to fetch historical data',
    });

    errorResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');

    return errorResponse;
  }
}
