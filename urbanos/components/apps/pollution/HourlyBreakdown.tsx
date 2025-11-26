'use client';

import { motion } from 'framer-motion';
import { Clock, TrendingUp } from 'lucide-react';
import { getAQILevel } from '@/lib/services/pollution-api';

interface HourlyDataPoint {
  time: string;
  aqi: number;
}

interface HourlyBreakdownProps {
  hourlyData: HourlyDataPoint[];
}

export default function HourlyBreakdown({ hourlyData }: HourlyBreakdownProps) {
  if (hourlyData.length === 0) {
    return (
      <div className="bg-foreground/5 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-blue-500" />
          <h4 className="text-lg font-semibold">24-Hour Breakdown</h4>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-foreground/70">No hourly data available</p>
        </div>
      </div>
    );
  }

  // Find peak hour
  const peakHour = hourlyData.reduce((max, item) => (item.aqi > max.aqi ? item : max), hourlyData[0]);
  const peakHourTime = new Date(peakHour.time);
  const peakHourLabel = `${String(peakHourTime.getHours()).padStart(2, '0')}:00`;

  // Get max AQI for scaling
  const maxAQI = Math.max(...hourlyData.map(d => d.aqi));
  const minAQI = Math.min(...hourlyData.map(d => d.aqi));

  return (
    <div className="bg-foreground/5 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          <h4 className="text-lg font-semibold">24-Hour Breakdown</h4>
        </div>
        {peakHour && (
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span className="text-foreground/70">Peak: {peakHourLabel} ({peakHour.aqi.toFixed(0)} AQI)</span>
          </div>
        )}
      </div>

      {/* Timeline visualization */}
      <div className="space-y-3">
        {hourlyData.slice(-24).map((dataPoint, index) => {
          const date = new Date(dataPoint.time);
          const hour = date.getHours();
          const hourLabel = `${String(hour).padStart(2, '0')}:00`;
          const aqiLevel = getAQILevel(dataPoint.aqi);
          const isPeak = dataPoint.time === peakHour.time;
          
          // Calculate bar height (0-100% of container)
          const barHeight = maxAQI > minAQI 
            ? ((dataPoint.aqi - minAQI) / (maxAQI - minAQI)) * 100 
            : 50;

          return (
            <motion.div
              key={dataPoint.time}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.02 }}
              className="flex items-center gap-3"
            >
              <div className="w-16 text-xs text-foreground/60 font-mono">{hourLabel}</div>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex-1 bg-foreground/10 rounded-full h-8 overflow-hidden relative">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barHeight}%` }}
                    transition={{ duration: 0.5, delay: index * 0.02 }}
                    style={{ backgroundColor: aqiLevel.color }}
                    className="h-full rounded-full flex items-center justify-end pr-2"
                  >
                    {isPeak && (
                      <span className="text-xs font-bold text-white">Peak</span>
                    )}
                  </motion.div>
                </div>
                <div className="w-20 text-right">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: aqiLevel.color }}
                  >
                    {dataPoint.aqi.toFixed(0)}
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-foreground/10">
        <div className="text-center">
          <p className="text-xs text-foreground/60 mb-1">Average</p>
          <p className="text-lg font-bold">
            {(hourlyData.reduce((sum, d) => sum + d.aqi, 0) / hourlyData.length).toFixed(0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-xs text-foreground/60 mb-1">Peak</p>
          <p className="text-lg font-bold text-red-500">{peakHour.aqi.toFixed(0)}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-foreground/60 mb-1">Lowest</p>
          <p className="text-lg font-bold text-green-500">{minAQI.toFixed(0)}</p>
        </div>
      </div>
    </div>
  );
}

