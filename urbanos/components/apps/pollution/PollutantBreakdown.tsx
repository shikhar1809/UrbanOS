'use client';

import { motion } from 'framer-motion';
import { getAQILevel } from '@/lib/services/pollution-api';
import { Wind, Droplets, Cloud, Factory } from 'lucide-react';

interface PollutantBreakdownProps {
  pm25?: number | null;
  pm10?: number | null;
  o3?: number | null;
  no2?: number | null;
  so2?: number | null;
  co?: number | null;
}

interface PollutantInfo {
  name: string;
  value: number | null;
  unit: string;
  safeLimit: number;
  description: string;
  healthImpact: string;
  icon: React.ReactNode;
}

export default function PollutantBreakdown({
  pm25,
  pm10,
  o3,
  no2,
  so2,
  co,
}: PollutantBreakdownProps) {
  const pollutants: PollutantInfo[] = [
    {
      name: 'PM2.5',
      value: pm25 ?? null,
      unit: 'µg/m³',
      safeLimit: 35,
      description: 'Fine particulate matter (2.5 micrometers)',
      healthImpact: 'Can penetrate deep into lungs, causing respiratory and cardiovascular issues',
      icon: <Wind className="w-4 h-4" />,
    },
    {
      name: 'PM10',
      value: pm10 ?? null,
      unit: 'µg/m³',
      safeLimit: 50,
      description: 'Coarse particulate matter (10 micrometers)',
      healthImpact: 'Can irritate eyes, nose, and throat, causing respiratory problems',
      icon: <Cloud className="w-4 h-4" />,
    },
    {
      name: 'O₃',
      value: o3 ?? null,
      unit: 'ppb',
      safeLimit: 100,
      description: 'Ozone',
      healthImpact: 'Can cause coughing, throat irritation, and worsen asthma',
      icon: <Droplets className="w-4 h-4" />,
    },
    {
      name: 'NO₂',
      value: no2 ?? null,
      unit: 'ppb',
      safeLimit: 100,
      description: 'Nitrogen Dioxide',
      healthImpact: 'Can cause respiratory inflammation and increase susceptibility to infections',
      icon: <Factory className="w-4 h-4" />,
    },
    {
      name: 'SO₂',
      value: so2 ?? null,
      unit: 'ppb',
      safeLimit: 75,
      description: 'Sulfur Dioxide',
      healthImpact: 'Can cause breathing difficulties, especially in people with asthma',
      icon: <Factory className="w-4 h-4" />,
    },
    {
      name: 'CO',
      value: co ?? null,
      unit: 'ppm',
      safeLimit: 9,
      description: 'Carbon Monoxide',
      healthImpact: 'Reduces oxygen delivery to body tissues, dangerous at high levels',
      icon: <Factory className="w-4 h-4" />,
    },
  ];

  const getStatusColor = (value: number | null, safeLimit: number) => {
    if (!value) return '#6b7280'; // gray
    const ratio = value / safeLimit;
    if (ratio <= 1) return '#10b981'; // green
    if (ratio <= 1.5) return '#f59e0b'; // yellow
    if (ratio <= 2) return '#f97316'; // orange
    return '#ef4444'; // red
  };

  const getStatusText = (value: number | null, safeLimit: number) => {
    if (!value) return 'No data';
    const ratio = value / safeLimit;
    if (ratio <= 1) return 'Safe';
    if (ratio <= 1.5) return 'Moderate';
    if (ratio <= 2) return 'Unhealthy';
    return 'Hazardous';
  };

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <h4 className="text-lg font-semibold mb-4">Pollutant Breakdown</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pollutants.map((pollutant, index) => {
          const statusColor = getStatusColor(pollutant.value, pollutant.safeLimit);
          const statusText = getStatusText(pollutant.value, pollutant.safeLimit);
          const percentage = pollutant.value
            ? Math.min((pollutant.value / pollutant.safeLimit) * 100, 200)
            : 0;

          return (
            <motion.div
              key={pollutant.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-foreground/5 rounded-lg p-4 border border-foreground/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div style={{ color: statusColor }}>{pollutant.icon}</div>
                  <div>
                    <p className="font-semibold">{pollutant.name}</p>
                    <p className="text-xs text-foreground/60">{pollutant.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold" style={{ color: statusColor }}>
                    {pollutant.value !== null && pollutant.value !== undefined
                      ? `${pollutant.value.toFixed(1)} ${pollutant.unit}`
                      : 'N/A'}
                  </p>
                  <p className="text-xs" style={{ color: statusColor }}>
                    {statusText}
                  </p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-2">
                <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(percentage, 100)}%` }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    style={{ backgroundColor: statusColor }}
                    className="h-full rounded-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-foreground/60 mt-1">
                  <span>Safe limit: {pollutant.safeLimit} {pollutant.unit}</span>
                  {pollutant.value && (
                    <span>
                      {((pollutant.value / pollutant.safeLimit) * 100).toFixed(0)}% of limit
                    </span>
                  )}
                </div>
              </div>

              {/* Health impact */}
              <p className="text-xs text-foreground/70 mt-2">{pollutant.healthImpact}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

