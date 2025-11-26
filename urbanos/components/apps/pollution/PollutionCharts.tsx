'use client';

import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Calendar, TrendingUp } from 'lucide-react';
import { getAQILevel } from '@/lib/services/pollution-api';

interface ChartDataPoint {
  time: string;
  aqi: number;
  date?: string;
  label?: string;
}

interface PollutionChartsProps {
  hourlyData: ChartDataPoint[];
  dailyData?: ChartDataPoint[];
  comparisonData?: {
    today: number;
    yesterday: number;
  };
}

export default function PollutionCharts({ hourlyData, dailyData, comparisonData }: PollutionChartsProps) {
  // Format hourly data for chart
  const formattedHourlyData = hourlyData.map((point) => {
    const date = new Date(point.time);
    return {
      time: `${String(date.getHours()).padStart(2, '0')}:00`,
      aqi: Math.round(point.aqi),
      fullTime: point.time,
    };
  });

  // Format daily data for chart
  const formattedDailyData = dailyData?.map((point) => {
    const date = new Date(point.date || point.time);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      aqi: Math.round(point.aqi),
    };
  });

  // Comparison data for bar chart
  const comparisonChartData = comparisonData
    ? [
        { period: 'Yesterday', aqi: Math.round(comparisonData.yesterday) },
        { period: 'Today', aqi: Math.round(comparisonData.today) },
      ]
    : [];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const aqiLevel = getAQILevel(value);
      return (
        <div className="bg-black/90 text-white p-3 rounded-lg border border-white/20">
          <p className="font-semibold mb-1">{label}</p>
          <p style={{ color: aqiLevel.color }}>
            AQI: <span className="font-bold">{value}</span> ({aqiLevel.level})
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* 24-Hour Trend Chart */}
      {formattedHourlyData.length > 0 && (
        <div className="bg-foreground/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <h4 className="text-lg font-semibold">24-Hour AQI Trend</h4>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={formattedHourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                label={{ value: 'AQI', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Today vs Yesterday Comparison */}
      {comparisonChartData.length > 0 && (
        <div className="bg-foreground/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h4 className="text-lg font-semibold">Today vs Yesterday</h4>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={comparisonChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="period"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                label={{ value: 'AQI', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="aqi"
                radius={[8, 8, 0, 0]}
                fill="#8b5cf6"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Weekly Trend Chart */}
      {formattedDailyData && formattedDailyData.length > 0 && (
        <div className="bg-foreground/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-green-500" />
            <h4 className="text-lg font-semibold">7-Day Trend</h4>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={formattedDailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                style={{ fontSize: '12px' }}
                label={{ value: 'AQI', angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.7)' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="aqi"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

