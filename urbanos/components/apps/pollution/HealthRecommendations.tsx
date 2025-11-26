'use client';

import { AlertCircle, Heart, Users, Baby, Shield } from 'lucide-react';
import { getAQILevel } from '@/lib/services/pollution-api';
import { motion } from 'framer-motion';

interface HealthRecommendationsProps {
  aqi: number;
  pm25?: number | null;
  pm10?: number | null;
}

export default function HealthRecommendations({ aqi, pm25, pm10 }: HealthRecommendationsProps) {
  const aqiLevel = getAQILevel(aqi);
  
  const getRecommendations = () => {
    if (aqi <= 50) {
      return {
        general: 'Air quality is satisfactory. Enjoy outdoor activities.',
        sensitive: 'No special precautions needed.',
        actions: [
          'Enjoy outdoor activities',
          'Open windows for fresh air',
          'Engage in outdoor exercise',
        ],
        vulnerable: false,
      };
    } else if (aqi <= 100) {
      return {
        general: 'Air quality is acceptable. Most people can enjoy outdoor activities.',
        sensitive: 'Sensitive individuals should limit prolonged outdoor exertion.',
        actions: [
          'Most people can continue outdoor activities',
          'Sensitive groups should take breaks',
          'Consider reducing intense outdoor exercise',
        ],
        vulnerable: true,
      };
    } else if (aqi <= 150) {
      return {
        general: 'Unhealthy for sensitive groups. Everyone should be cautious.',
        sensitive: 'Sensitive groups should avoid prolonged outdoor activities.',
        actions: [
          'Sensitive groups should stay indoors',
          'Everyone should limit outdoor exercise',
          'Keep windows closed',
          'Use air purifiers if available',
        ],
        vulnerable: true,
      };
    } else if (aqi <= 200) {
      return {
        general: 'Unhealthy air quality. Everyone may experience health effects.',
        sensitive: 'Sensitive groups should avoid all outdoor activities.',
        actions: [
          'Avoid outdoor activities',
          'Stay indoors with windows closed',
          'Use air purifiers',
          'Wear N95 masks if going outside is necessary',
          'Postpone outdoor exercise',
        ],
        vulnerable: true,
      };
    } else if (aqi <= 300) {
      return {
        general: 'Very unhealthy. Health warnings for everyone.',
        sensitive: 'Everyone should avoid outdoor exposure.',
        actions: [
          'Stay indoors',
          'Keep all windows and doors closed',
          'Use air purifiers',
          'Avoid physical exertion',
          'Wear N95 masks if going outside is unavoidable',
          'Consider relocating if possible',
        ],
        vulnerable: true,
      };
    } else {
      return {
        general: 'Hazardous air quality. Health alert for everyone.',
        sensitive: 'Emergency conditions. Take immediate precautions.',
        actions: [
          'Stay indoors at all times',
          'Keep all windows and doors sealed',
          'Use high-efficiency air purifiers',
          'Avoid any physical activity',
          'Wear N95 or better masks if going outside is absolutely necessary',
          'Consider evacuating if you have respiratory conditions',
        ],
        vulnerable: true,
      };
    }
  };

  const recommendations = getRecommendations();

  return (
    <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-6 border border-orange-500/20">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-red-500" />
        <h4 className="text-lg font-semibold">Health Recommendations</h4>
      </div>

      <div className="space-y-4">
        {/* General Recommendation */}
        <div className="bg-foreground/5 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">General Population</p>
              <p className="text-sm text-foreground/70">{recommendations.general}</p>
            </div>
          </div>
        </div>

        {/* Sensitive Groups */}
        {recommendations.vulnerable && (
          <div className="bg-foreground/5 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Sensitive Groups</p>
                <p className="text-sm text-foreground/70 mb-2">{recommendations.sensitive}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-red-500/20 rounded-full flex items-center gap-1">
                    <Baby className="w-3 h-3" />
                    Children
                  </span>
                  <span className="text-xs px-2 py-1 bg-red-500/20 rounded-full flex items-center gap-1">
                    <Shield className="w-3 h-3" />
                    Elderly
                  </span>
                  <span className="text-xs px-2 py-1 bg-red-500/20 rounded-full flex items-center gap-1">
                    <Heart className="w-3 h-3" />
                    Respiratory
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div>
          <p className="font-medium mb-2 text-sm">Recommended Actions:</p>
          <ul className="space-y-2">
            {recommendations.actions.map((action, index) => (
              <motion.li
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-2 text-sm text-foreground/80"
              >
                <span className="text-orange-500 mt-1">•</span>
                <span>{action}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Pollutant-specific warnings */}
        {(pm25 && pm25 > 35) || (pm10 && pm10 > 50) ? (
          <div className="bg-red-500/20 rounded-lg p-3 border border-red-500/30">
            <p className="text-sm font-medium text-red-400 mb-1">High Particulate Matter</p>
            <p className="text-xs text-foreground/70">
              {pm25 && pm25 > 35 && `PM2.5 levels (${pm25.toFixed(1)}) exceed safe limits. `}
              {pm10 && pm10 > 50 && `PM10 levels (${pm10.toFixed(1)}) exceed safe limits. `}
              These fine particles can penetrate deep into lungs and cause respiratory issues.
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

