'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WeatherData {
  temp: number;
  condition: string;
  emoji: string;
  description: string;
  humidity?: number;
  windSpeed?: number;
}

export default function WeatherDisplay() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get weather for Lucknow, India
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        // Use our API route to fetch weather (avoids CORS issues)
        const response = await fetch('/api/weather');
        
        if (!response.ok) {
          throw new Error('Failed to fetch weather');
        }
        
        const weatherData = await response.json();
        setWeather(weatherData);
      } catch (err: any) {
        console.error('Error fetching weather:', err);
        setError(err.message || 'Failed to load weather');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
    // Refresh every 30 minutes
    const interval = setInterval(fetchWeather, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const getWeatherIcon = () => {
    if (!weather) return null;
    
    const condition = weather.condition.toLowerCase();
    
    // Map weather conditions to icons
    if (condition.includes('snow')) {
      return <CloudSnow className="w-8 h-8 text-blue-300" strokeWidth={2.5} />;
    } else if (condition.includes('rain') || condition.includes('drizzle') || condition.includes('thunderstorm')) {
      return <CloudRain className="w-8 h-8 text-blue-400" strokeWidth={2.5} />;
    } else if (condition.includes('clear') || condition.includes('sun')) {
      return <Sun className="w-8 h-8 text-yellow-400" strokeWidth={2.5} />;
    } else if (condition.includes('cloud')) {
      return <Cloud className="w-8 h-8 text-gray-400" strokeWidth={2.5} />;
    } else {
      return <Cloud className="w-8 h-8 text-gray-300" strokeWidth={2.5} />;
    }
  };

  const isRaining = weather?.condition.toLowerCase().includes('rain') || 
                    weather?.condition.toLowerCase().includes('drizzle') ||
                    weather?.condition.toLowerCase().includes('thunderstorm');

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-3 text-white"
      >
        <div className="text-4xl animate-pulse">🌤️</div>
        <span className="text-base font-medium">Loading...</span>
      </motion.div>
    );
  }

  if (error || !weather) {
    return null; // Don't show error, just hide component
  }

  return (
    <>
      {/* Weather Display - Big and Prominent */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col items-center gap-2 text-white"
      >
        {/* Big Weather Emoji */}
        <div className="text-6xl md:text-7xl leading-none">
          {weather.emoji}
        </div>
        
        {/* Temperature - Big */}
        <div className="text-4xl md:text-5xl font-bold leading-tight">
          {weather.temp}°C
        </div>
        
        {/* Weather Description */}
        <div className="text-sm md:text-base font-medium text-white/90 capitalize text-center px-2">
          {weather.description}
        </div>
      </motion.div>

      {/* Rain Effect - only show when raining */}
      {isRaining && <RainEffect />}
    </>
  );
}

// Rain Effect Component
function RainEffect() {
  return (
    <div className="fixed inset-0 z-[60] pointer-events-none overflow-hidden">
      {Array.from({ length: 100 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-0.5 bg-blue-300/60"
          initial={{
            top: '-10%',
            left: `${(i * 10) % 100}%`,
            height: '20px',
          }}
          animate={{
            top: '110%',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 0.5 + 0.3,
            repeat: Infinity,
            delay: Math.random() * 0.5,
            ease: 'linear',
          }}
          style={{
            boxShadow: '0 0 6px rgba(147, 197, 253, 0.5)',
          }}
        />
      ))}
      
      {/* Additional rain drops for more density */}
      {Array.from({ length: 50 }).map((_, i) => (
        <motion.div
          key={`drop-${i}`}
          className="absolute w-1 h-1 bg-blue-400/70 rounded-full"
          initial={{
            top: '-5%',
            left: `${(i * 15) % 100}%`,
          }}
          animate={{
            top: '105%',
            opacity: [0, 1, 1, 0],
          }}
          transition={{
            duration: Math.random() * 0.4 + 0.2,
            repeat: Infinity,
            delay: Math.random() * 0.3,
            ease: 'linear',
          }}
          style={{
            boxShadow: '0 0 4px rgba(96, 165, 250, 0.6)',
          }}
        />
      ))}
    </div>
  );
}

