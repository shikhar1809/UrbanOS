import { NextResponse } from 'next/server';

// Cache duration in seconds (30 minutes)
const CACHE_DURATION = 1800;

export async function GET() {
  try {
    // Use Meteosource Weather API for Lucknow, India
    const apiKey = process.env.METASOURCE_API_KEY || 'l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f';
    
    // Meteosource API - Lucknow coordinates: 26.8467, 80.9462
    // Using place_id or coordinates
    const response = await fetch(
      `https://www.meteosource.com/api/v1/free/point?lat=26.8467&lon=80.9462&sections=current&key=${apiKey}`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: CACHE_DURATION },
      }
    );

    if (!response.ok) {
      // Fallback to wttr.in if Meteosource fails
      const fallbackResponse = await fetch(
        'https://wttr.in/Lucknow?format=j1',
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      );
      
      if (fallbackResponse.ok) {
        const data = await fallbackResponse.json();
        if (data.current_condition && data.current_condition[0]) {
          const current = data.current_condition[0];
          const condition = current.weatherDesc[0].value.toLowerCase();
          
          return NextResponse.json({
            temp: parseInt(current.temp_C),
            condition: current.weatherDesc[0].value,
            emoji: getWeatherEmoji(condition),
            description: current.weatherDesc[0].value,
            humidity: parseInt(current.humidity),
            windSpeed: parseFloat(current.windspeedKmph) || 0,
          });
        }
      }
      
      throw new Error(`Weather API returned status ${response.status}`);
    }

    const data = await response.json();
    
    // Parse Meteosource API response
    const current = data.current;
    const condition = (current?.weather || current?.summary || 'Clear').toLowerCase();
    const temp = current?.temperature || 25;
    const description = current?.summary || current?.weather || 'Clear sky';
    const humidity = current?.humidity || 0;
    const windSpeed = current?.wind?.speed || 0;
    
    const nextResponse = NextResponse.json({
      temp: Math.round(temp),
      condition: description,
      emoji: getWeatherEmoji(condition),
      description: description,
      humidity: Math.round(humidity),
      windSpeed: Math.round(windSpeed * 10) / 10, // Round to 1 decimal place
    });

    // Add cache headers for client-side caching
    nextResponse.headers.set('Cache-Control', `public, s-maxage=${CACHE_DURATION}, stale-while-revalidate=${CACHE_DURATION * 2}`);
    
    return nextResponse;
  } catch (error) {
    // Only log errors (not sensitive data)
    console.error('Weather API error');
    
    // Return default weather data on error with shorter cache
    const errorResponse = NextResponse.json({
      temp: 25,
      condition: 'Clear',
      emoji: '☀️',
      description: 'Clear sky',
      humidity: 0,
      windSpeed: 0,
    });
    
    // Shorter cache for error responses
    errorResponse.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=120');
    
    return errorResponse;
  }
}

function getWeatherEmoji(condition: string): string {
  const lower = condition.toLowerCase();
  if (lower.includes('rain') || lower.includes('drizzle') || lower.includes('shower')) {
    return '🌧️';
  } else if (lower.includes('thunder') || lower.includes('storm')) {
    return '⛈️';
  } else if (lower.includes('snow') || lower.includes('sleet')) {
    return '❄️';
  } else if (lower.includes('cloud') || lower.includes('overcast')) {
    return '☁️';
  } else if (lower.includes('fog') || lower.includes('mist') || lower.includes('haze')) {
    return '🌫️';
  } else if (lower.includes('clear') || lower.includes('sunny')) {
    return '☀️';
  } else if (lower.includes('partly') || lower.includes('few clouds')) {
    return '⛅';
  } else {
    return '☀️'; // Default to sunny
  }
}

