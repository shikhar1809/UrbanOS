'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import {
  fetchAQIData,
  getAQILevel,
  calculateTrend,
  getHistoricalData,
  comparePeriods,
  getPeakPollutionTime,
  PollutionTrend,
} from '@/lib/services/pollution-api';
import { fetchGoogleAQI, fetchGoogleWeather } from '@/lib/services/google-environment-api';
import { PollutionData, Report } from '@/types';
import { MapPin, AlertTriangle, TrendingUp, RefreshCw, Wind, TrendingDown, Minus, Clock, Calendar } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import HealthRecommendations from './pollution/HealthRecommendations';
import PollutantBreakdown from './pollution/PollutantBreakdown';
import PollutionCharts from './pollution/PollutionCharts';
import HourlyBreakdown from './pollution/HourlyBreakdown';
import ComparisonWidget from './pollution/ComparisonWidget';
import HealthVisualizer from './pollution/HealthVisualizer';

import { useMapTileManager } from '@/lib/hooks/useMapTileManager';
import { MapBounds } from '@/lib/services/map-service';

const RiskMap = dynamic(() => import('./predictor/RiskMap'), { ssr: false });

export default function PollutionApp() {
  const [pollutionData, setPollutionData] = useState<PollutionData[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [areaRankings, setAreaRankings] = useState<Array<{ area: string; count: number; avgLevel: number; trend?: PollutionTrend }>>([]);
  const [showLoading, setShowLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<'24h' | '7d' | '30d'>('24h');

  useEffect(() => {
    // Force loading to false after max 3 seconds (safety timeout)
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout: Forcing loading to false');
      setLoading(false);
      setShowLoading(false);
    }, 3000);

    loadData();

    // Refresh AQI data every 30 minutes
    const interval = setInterval(() => {
      refreshAQIData();
    }, 30 * 60 * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, []);

  // Hide loading spinner after 2 seconds max
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);

    // Set a timeout to ensure loading never hangs forever
    const loadingTimeout = setTimeout(() => {
      console.warn('Loading timeout - forcing loading to false');
      setLoading(false);
    }, 5000); // 5 second max loading time

    try {
      // Load pollution data from database
      const { data: pollutionRes, error: pollutionError } = await supabase
        .from('pollution_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (pollutionError) {
        console.warn('Error loading pollution data from DB:', pollutionError);
        // Continue with empty array instead of throwing
      }

      // Load environmental reports from reports table
      const { data: reportsRes, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('type', 'environmental')
        .order('created_at', { ascending: false })
        .limit(50);

      if (reportsError) {
        console.warn('Error loading environmental reports:', reportsError);
        // Continue with empty array instead of throwing
      }

      // Set data immediately (don't wait for API calls)
      setPollutionData(pollutionRes || []);
      setUserReports(reportsRes || []);

      // Calculate area rankings from existing data
      calculateAreaRankings(pollutionRes || []);

      // Clear timeout since we loaded successfully
      clearTimeout(loadingTimeout);
      setLoading(false);

      // Try to sync user reports (non-blocking, don't wait)
      syncUserReportsToPollutionData(reportsRes || []).catch(err => {
        console.warn('Error syncing user reports:', err);
      });

      // Try to fetch fresh AQI data (non-blocking, don't wait)
      refreshAQIData().catch(err => {
        console.warn('Error refreshing AQI data:', err);
      });
    } catch (error) {
      console.error('Error loading pollution data:', error);
      clearTimeout(loadingTimeout);
      setLoading(false);
    }
  };

  const syncUserReportsToPollutionData = async (reports: Report[]) => {
    for (const report of reports) {
      // Check if pollution data already exists for this report
      const { data: existing } = await supabase
        .from('pollution_data')
        .select('id')
        .eq('report_id', report.id)
        .limit(1);

      if (!existing || existing.length === 0) {
        // Create pollution data entry from report
        await supabase.from('pollution_data').insert({
          location: report.location,
          pollution_type: 'air', // Default, can be enhanced
          level: report.priority === 'high' ? 80 : report.priority === 'medium' ? 50 : 30,
          source: 'user_report',
          report_id: report.id,
          timestamp: report.created_at,
        });
      }
    }
  };

  // Tile-based data fetching for infinite map scrolling
  const fetchPollutionTiles = async (bounds: MapBounds, zoom: number) => {
    try {
      // 1. Zoom < 14: Load Clusters (Super-points)
      // 2. Zoom >= 14: Load Raw Points (RPC or direct)

      if (zoom < 14) {
        // Calculate grid size based on zoom
        // Zoom 10: ~0.1 deg, Zoom 13: ~0.01 deg
        const gridSize = 0.5 / Math.pow(2, zoom - 10);

        const { data: clusters, error } = await supabase.rpc('get_pollution_clusters_in_bounds', {
          min_lat: bounds.minLat,
          max_lat: bounds.maxLat,
          min_lng: bounds.minLng,
          max_lng: bounds.maxLng,
          grid_size: gridSize
        });

        if (error) {
          console.warn('Cluster fetch failed', error);
          return [];
        }

        // Transform clusters to PollutionData format
        return (clusters || []).map((c: any) => ({
          id: `cluster-${c.lat}-${c.lng}`,
          location: { lat: c.lat, lng: c.lng },
          pollution_type: 'cluster',
          level: c.avg_aqi,
          aqi_value: c.avg_aqi,
          source: 'cluster',
          timestamp: new Date().toISOString(),
          // Custom properties for visualization
          isCluster: true,
          count: c.count
        }));
      }

      // High Zoom: Load Raw Points
      const { data, error } = await supabase.rpc('get_pollution_in_bounds', {
        min_lat: bounds.minLat,
        max_lat: bounds.maxLat,
        min_lng: bounds.minLng,
        max_lng: bounds.maxLng,
      });

      if (!error && data) {
        return data;
      }

      console.warn('Tile fetch failed or RPC missing', error);
      return [];
    } catch (e) {
      console.error('Error fetching tiles:', e);
      return [];
    }
  };

  const { data: tiledPollutionData, loading: tilesLoading, onMoveEnd: onMapMove } = useMapTileManager<PollutionData>({
    fetchData: fetchPollutionTiles,
    zoom: 12,
    deduplicate: (items) => {
      // Simple deduplication by ID
      const seen = new Set();
      return items.filter(item => {
        const duplicate = seen.has(item.id);
        seen.add(item.id);
        return !duplicate;
      });
    }
  });

  const refreshAQIData = async () => {
    setRefreshing(true);
    try {
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AQI API timeout')), 30000)
      );

      // Fetch multiple locations (4-5) from AQICN.org
      const response = await Promise.race([
        fetch('/api/air-quality?city=lucknow&multiple=true'),
        timeoutPromise
      ]) as Response;

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      // Also try fetching from Google AQI for current location (Lucknow)
      try {
        const googleAQI = await fetchGoogleAQI(26.8467, 80.9462);
        if (googleAQI) {
          console.log("Google AQI fetched:", googleAQI);
          // Insert Google data as a high-confidence API reading
          await supabase.from('pollution_data').insert({
            location: {
              lat: 26.8467,
              lng: 80.9462,
              address: 'Lucknow (Google API)',
              area_name: 'Lucknow',
            },
            pollution_type: 'air',
            level: googleAQI.aqi,
            aqi_value: googleAQI.aqi,
            source: 'google_api',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.warn("Failed to fetch Google AQI in PollutionApp", e);
      }

      if (data && data.locations && data.locations.length > 0) {
        const updates = data.locations.map((aqiData: any) => ({
          location: {
            lat: aqiData.city.geo[0],
            lng: aqiData.city.geo[1],
            address: aqiData.city.name,
            area_name: 'Lucknow',
          },
          pollution_type: 'air',
          level: aqiData.aqi,
          aqi_value: aqiData.aqi,
          pm25_aqi: aqiData.pm25?.aqi || null,
          pm10_aqi: aqiData.pm10?.aqi || null,
          o3_aqi: aqiData.o3?.aqi || null,
          no2_aqi: aqiData.no2?.aqi || null,
          so2_aqi: aqiData.so2?.aqi || null,
          co_aqi: aqiData.co?.aqi || null,
          source: 'api',
          timestamp: aqiData.time?.s ? new Date(aqiData.time.s).toISOString() : new Date().toISOString(),
        }));

        const { error: insertError } = await supabase
          .from('pollution_data')
          .insert(updates);

        if (insertError) {
          console.warn('Error inserting AQI data:', insertError);
        } else {
          await loadData();
        }
      }

    } catch (error: any) {
      console.warn('Error refreshing AQI data:', error.message || error);
      // Don't throw - allow UI to show existing data
    } finally {
      setRefreshing(false);
    }
  };

  // Helper functions for AQI calculations (simplified versions)
  const calculateAQIFromO3 = (o3: number): number => {
    // Simplified O3 AQI calculation
    if (o3 <= 0.054) return Math.round((50 / 0.054) * o3);
    if (o3 <= 0.070) return Math.round(((100 - 51) / (0.070 - 0.055)) * (o3 - 0.055) + 51);
    if (o3 <= 0.085) return Math.round(((150 - 101) / (0.085 - 0.071)) * (o3 - 0.071) + 101);
    if (o3 <= 0.105) return Math.round(((200 - 151) / (0.105 - 0.086)) * (o3 - 0.086) + 151);
    return Math.round(((300 - 201) / (0.200 - 0.106)) * (o3 - 0.106) + 201);
  };

  const calculateAQIFromNO2 = (no2: number): number => {
    // Simplified NO2 AQI calculation
    if (no2 <= 0.053) return Math.round((50 / 0.053) * no2);
    if (no2 <= 0.100) return Math.round(((100 - 51) / (0.100 - 0.054)) * (no2 - 0.054) + 51);
    if (no2 <= 0.360) return Math.round(((150 - 101) / (0.360 - 0.101)) * (no2 - 0.101) + 101);
    if (no2 <= 0.649) return Math.round(((200 - 151) / (0.649 - 0.361)) * (no2 - 0.361) + 151);
    return Math.round(((300 - 201) / (1.249 - 0.650)) * (no2 - 0.650) + 201);
  };

  const calculateAQIFromSO2 = (so2: number): number => {
    // Simplified SO2 AQI calculation
    if (so2 <= 0.035) return Math.round((50 / 0.035) * so2);
    if (so2 <= 0.075) return Math.round(((100 - 51) / (0.075 - 0.036)) * (so2 - 0.036) + 51);
    if (so2 <= 0.185) return Math.round(((150 - 101) / (0.185 - 0.076)) * (so2 - 0.076) + 101);
    if (so2 <= 0.304) return Math.round(((200 - 151) / (0.304 - 0.186)) * (so2 - 0.186) + 151);
    return Math.round(((300 - 201) / (0.604 - 0.305)) * (so2 - 0.305) + 201);
  };

  const calculateAQIFromCO = (co: number): number => {
    // Simplified CO AQI calculation (CO in ppm, convert to mg/m³ if needed)
    // Assuming input is in mg/m³
    if (co <= 4.4) return Math.round((50 / 4.4) * co);
    if (co <= 9.4) return Math.round(((100 - 51) / (9.4 - 4.5)) * (co - 4.5) + 51);
    if (co <= 12.4) return Math.round(((150 - 101) / (12.4 - 9.5)) * (co - 9.5) + 101);
    if (co <= 15.4) return Math.round(((200 - 151) / (15.4 - 12.5)) * (co - 12.5) + 151);
    return Math.round(((300 - 201) / (30.4 - 15.5)) * (co - 15.5) + 201);
  };

  // State for historical data from AQICN.org
  const [historicalData, setHistoricalData] = useState<any>(null);
  const [loadingHistorical, setLoadingHistorical] = useState(false);

  // Fetch historical data from AQICN.org API
  useEffect(() => {
    const fetchHistoricalData = async () => {
      setLoadingHistorical(true);
      try {
        const response = await fetch('/api/air-quality/historical?city=lucknow&days=7');
        if (response.ok) {
          const data = await response.json();
          setHistoricalData(data);
          console.log('Historical data loaded:', data);
        }
      } catch (error) {
        console.warn('Error fetching historical data:', error);
      } finally {
        setLoadingHistorical(false);
      }
    };

    fetchHistoricalData();
  }, []);

  // Calculate trends and historical data - use AQICN.org historical data if available
  const trends = useMemo(() => {
    // If we have historical data from AQICN.org, use it for more accurate comparisons
    if (historicalData && historicalData.locations && historicalData.locations.length > 0) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      // Aggregate all locations' data
      let todayAvg = 0;
      let yesterdayAvg = 0;
      let todayCount = 0;
      let yesterdayCount = 0;

      historicalData.locations.forEach((location: any) => {
        location.dailyData.forEach((day: any) => {
          if (day.date === today && day.aqi) {
            todayAvg += day.aqi;
            todayCount++;
          }
          if (day.date === yesterdayStr && day.aqi) {
            yesterdayAvg += day.aqi;
            yesterdayCount++;
          }
        });
      });

      if (todayCount > 0) todayAvg = todayAvg / todayCount;
      if (yesterdayCount > 0) yesterdayAvg = yesterdayAvg / yesterdayCount;

      // Calculate week comparison
      const lastWeek = new Date(now);
      lastWeek.setDate(lastWeek.getDate() - 7);
      const lastWeekStr = lastWeek.toISOString().split('T')[0];

      let thisWeekAvg = 0;
      let lastWeekAvg = 0;
      let thisWeekCount = 0;
      let lastWeekCount = 0;

      historicalData.locations.forEach((location: any) => {
        location.dailyData.forEach((day: any) => {
          const dayDate = new Date(day.date);
          if (dayDate >= lastWeek && day.aqi) {
            thisWeekAvg += day.aqi;
            thisWeekCount++;
          }
          const lastWeekStart = new Date(lastWeek);
          lastWeekStart.setDate(lastWeekStart.getDate() - 7);
          if (dayDate >= lastWeekStart && dayDate < lastWeek && day.aqi) {
            lastWeekAvg += day.aqi;
            lastWeekCount++;
          }
        });
      });

      if (thisWeekCount > 0) thisWeekAvg = thisWeekAvg / thisWeekCount;
      if (lastWeekCount > 0) lastWeekAvg = lastWeekAvg / lastWeekCount;

      return {
        day: calculateTrend(todayAvg || 50, yesterdayAvg || 50, 'day'),
        week: calculateTrend(thisWeekAvg || 50, lastWeekAvg || 50, 'week'),
      };
    }

    // Fallback to database data if historical API data not available
    if (pollutionData.length === 0) return null;

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    // Today's data
    const todayData = pollutionData.filter(
      (item) => new Date(item.timestamp).toDateString() === now.toDateString()
    );

    // Yesterday's data
    const yesterdayData = pollutionData.filter(
      (item) => new Date(item.timestamp).toDateString() === yesterday.toDateString()
    );

    // This week's data
    const thisWeekData = pollutionData.filter(
      (item) => new Date(item.timestamp) >= lastWeek
    );

    // Last week's data
    const lastWeekStart = new Date(lastWeek);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekData = pollutionData.filter(
      (item) => {
        const itemDate = new Date(item.timestamp);
        return itemDate >= lastWeekStart && itemDate < lastWeek;
      }
    );

    return {
      day: comparePeriods(todayData, yesterdayData),
      week: comparePeriods(thisWeekData, lastWeekData),
    };
  }, [pollutionData, historicalData]);

  // Get hourly and daily data
  const hourlyData = useMemo(() => {
    return getHistoricalData(pollutionData, 'hour').slice(-24);
  }, [pollutionData]);

  const dailyData = useMemo(() => {
    return getHistoricalData(pollutionData, 'day').slice(-7);
  }, [pollutionData]);

  // Get peak pollution time
  const peakTime = useMemo(() => {
    return getPeakPollutionTime(hourlyData);
  }, [hourlyData]);

  const calculateAreaRankings = (data: PollutionData[]) => {
    const areaMap = new Map<string, {
      count: number;
      totalLevel: number;
      currentData: PollutionData[];
      previousData: PollutionData[];
    }>();

    const now = new Date();
    const lastWeek = new Date(now);
    lastWeek.setDate(lastWeek.getDate() - 7);

    data.forEach((item) => {
      const area = item.location.area_name || item.location.address || 'Unknown';
      const existing = areaMap.get(area) || {
        count: 0,
        totalLevel: 0,
        currentData: [],
        previousData: [],
      };

      const itemDate = new Date(item.timestamp);
      if (itemDate >= lastWeek) {
        existing.currentData.push(item);
      } else {
        existing.previousData.push(item);
      }

      areaMap.set(area, {
        count: existing.count + 1,
        totalLevel: existing.totalLevel + (item.aqi_value || item.level),
        currentData: existing.currentData,
        previousData: existing.previousData,
      });
    });

    const rankings = Array.from(areaMap.entries())
      .map(([area, stats]) => {
        const avgLevel = stats.totalLevel / stats.count;
        const currentAvg = stats.currentData.length > 0
          ? stats.currentData.reduce((sum, item) => sum + (item.aqi_value || item.level), 0) / stats.currentData.length
          : avgLevel;
        const previousAvg = stats.previousData.length > 0
          ? stats.previousData.reduce((sum, item) => sum + (item.aqi_value || item.level), 0) / stats.previousData.length
          : avgLevel;

        const trend = calculateTrend(currentAvg, previousAvg, 'week');

        return {
          area,
          count: stats.count,
          avgLevel,
          trend,
        };
      })
      .sort((a, b) => b.avgLevel - a.avgLevel)
      .slice(0, 10);

    setAreaRankings(rankings);
  };

  // Show loading only for first 2 seconds max, then always show content
  if (showLoading && loading && pollutionData.length === 0 && userReports.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-sm text-foreground/70">Loading pollution data...</p>
        </div>
      </div>
    );
  }

  const defaultCenter: [number, number] = [26.8467, 80.9462]; // Lucknow

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl font-bold mb-1">Pollution Monitor</h3>
              <p className="text-sm text-foreground/70">
                Real-time pollution tracking by area - Data from user reports and AQI API
              </p>
            </div>
            <button
              onClick={refreshAQIData}
              disabled={refreshing}
              className="px-4 py-2 bg-windows-blue text-white rounded-lg hover:bg-windows-blue/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh AQI
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Comparison Widgets */}
          {trends && pollutionData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ComparisonWidget trend={trends.day} label="Today vs Yesterday" icon={<Clock className="w-4 h-4" />} />
              <ComparisonWidget trend={trends.week} label="This Week vs Last Week" icon={<Calendar className="w-4 h-4" />} />
            </div>
          )}

          {/* Current AQI Status - Enhanced */}
          {pollutionData.length > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-xl p-6 border border-blue-500/30"
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-lg font-semibold">Current Air Quality - Lucknow</h4>
                    {trends?.day && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: trends.day.direction === 'up' ? '#ef444420' : trends.day.direction === 'down' ? '#10b98120' : '#6b728020',
                          color: trends.day.direction === 'up' ? '#ef4444' : trends.day.direction === 'down' ? '#10b981' : '#6b7280',
                        }}
                      >
                        {trends.day.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                          trends.day.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                            <Minus className="w-3 h-3" />}
                        {trends.day.change.toFixed(1)}% {trends.day.direction === 'up' ? 'worse' : trends.day.direction === 'down' ? 'better' : 'stable'} than yesterday
                      </div>
                    )}
                  </div>
                  {(() => {
                    const latest = pollutionData[0];
                    const aqi = latest.aqi_value || latest.level;
                    const aqiLevel = getAQILevel(aqi);
                    return (
                      <div className="flex items-center gap-4 flex-wrap">
                        <div className="text-5xl font-bold" style={{ color: aqiLevel.color }}>
                          {aqi.toFixed(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-xl font-semibold" style={{ color: aqiLevel.color }}>
                              {aqiLevel.level}
                            </p>
                            <span
                              className="px-2 py-1 rounded-full text-xs font-medium border"
                              style={{
                                backgroundColor: `${aqiLevel.color}20`,
                                color: aqiLevel.color,
                                borderColor: aqiLevel.color,
                              }}
                            >
                              {aqiLevel.description}
                            </span>
                          </div>
                          <p className="text-sm text-foreground/70 mb-1">
                            {latest.pm25_aqi ? `PM2.5: ${latest.pm25_aqi.toFixed(1)}` : ''}
                            {latest.pm10_aqi ? ` • PM10: ${latest.pm10_aqi.toFixed(1)}` : ''}
                          </p>
                          <p className="text-xs text-foreground/60">
                            Last updated: {new Date(latest.timestamp || latest.created_at).toLocaleString()}
                            {peakTime && ` • Peak pollution: ${String(peakTime.hour).padStart(2, '0')}:00 (${peakTime.aqi.toFixed(0)} AQI)`}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                <div className="text-right">
                  <p className="text-sm text-foreground/70 mb-1">Health Impact</p>
                  {(() => {
                    const latest = pollutionData[0];
                    const aqi = latest.aqi_value || latest.level;
                    const aqiLevel = getAQILevel(aqi);
                    const healthMessage =
                      aqi <= 50 ? 'Good - No health concerns' :
                        aqi <= 100 ? 'Moderate - Sensitive groups may experience minor issues' :
                          aqi <= 150 ? 'Unhealthy for Sensitive Groups' :
                            aqi <= 200 ? 'Unhealthy - Everyone may experience health effects' :
                              'Very Unhealthy - Health alert';
                    return (
                      <p className="text-sm font-medium" style={{ color: aqiLevel.color }}>
                        {healthMessage}
                      </p>
                    );
                  })()}
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-xl p-6 border border-gray-500/30">
              <div className="text-center py-8">
                <Wind className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                <h4 className="text-lg font-semibold mb-2">No Pollution Data Available</h4>
                <p className="text-sm text-foreground/70 mb-4">
                  Pollution data will appear here once readings are collected.
                </p>
                <button
                  onClick={refreshAQIData}
                  disabled={refreshing}
                  className="px-4 py-2 bg-windows-blue text-white rounded-lg hover:bg-windows-blue/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Fetching AQI Data...' : 'Fetch AQI Data'}
                </button>
              </div>
            </div>
          )}



          {/* Health Visualizer - NEW */}
          {pollutionData.length > 0 && (() => {
            const latest = pollutionData[0];
            const aqi = latest.aqi_value || latest.level;
            return <HealthVisualizer aqi={aqi} />;
          })()}

          {/* Health Recommendations */}
          {pollutionData.length > 0 && (() => {
            const latest = pollutionData[0];
            const aqi = latest.aqi_value || latest.level;
            return (
              <HealthRecommendations
                aqi={aqi}
                pm25={latest.pm25_aqi}
                pm10={latest.pm10_aqi}
              />
            );
          })()}

          {/* Pollutant Breakdown */}
          {pollutionData.length > 0 && (() => {
            const latest = pollutionData[0];
            return (
              <PollutantBreakdown
                pm25={latest.pm25_aqi}
                pm10={latest.pm10_aqi}
                o3={latest.o3_aqi}
                no2={latest.no2_aqi}
                so2={latest.so2_aqi}
                co={latest.co_aqi}
              />
            );
          })()}

          {/* Charts */}
          {hourlyData.length > 0 && (
            <PollutionCharts
              hourlyData={hourlyData}
              dailyData={dailyData}
              comparisonData={trends?.day ? {
                today: trends.day.current,
                yesterday: trends.day.previous,
              } : undefined}
            />
          )}

          {/* Hourly Breakdown */}
          {hourlyData.length > 0 && (
            <HourlyBreakdown hourlyData={hourlyData} />
          )}

          {/* Area Rankings - Enhanced */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="text-lg font-semibold">Most Polluted Areas</h4>
            </div>
            {areaRankings.length === 0 ? (
              <div className="text-center py-8">
                <Wind className="w-12 h-12 text-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-foreground/70 mb-2">No pollution data available yet</p>
                <p className="text-xs text-foreground/50">
                  Data will appear here once pollution readings are collected from user reports or AQI API
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {areaRankings.map((ranking, index) => {
                  const aqiLevel = getAQILevel(ranking.avgLevel);
                  const maxAQI = 300; // Scale for progress bar
                  const progressPercentage = Math.min((ranking.avgLevel / maxAQI) * 100, 100);

                  // Determine best time to visit (lowest pollution hours)
                  const bestTime = peakTime ?
                    (peakTime.hour < 12 ? 'Morning (6-10 AM)' : peakTime.hour < 18 ? 'Afternoon (2-6 PM)' : 'Evening (6-10 PM)') :
                    'Morning (6-10 AM)';

                  return (
                    <motion.div
                      key={ranking.area}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-foreground/5 rounded-lg p-4 border border-foreground/10 hover:border-foreground/20 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                            style={{ backgroundColor: aqiLevel.color }}
                          >
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold">{ranking.area}</p>
                            <p className="text-xs text-foreground/60">
                              {ranking.count} readings • Avg: {ranking.avgLevel.toFixed(0)} AQI
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold mb-1" style={{ color: aqiLevel.color }}>
                            {aqiLevel.level}
                          </p>
                          {ranking.trend && (
                            <div className="flex items-center gap-1 text-xs"
                              style={{
                                color: ranking.trend.direction === 'up' ? '#ef4444' :
                                  ranking.trend.direction === 'down' ? '#10b981' : '#6b7280',
                              }}
                            >
                              {ranking.trend.direction === 'up' ? <TrendingUp className="w-3 h-3" /> :
                                ranking.trend.direction === 'down' ? <TrendingDown className="w-3 h-3" /> :
                                  <Minus className="w-3 h-3" />}
                              {ranking.trend.change.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="mb-2">
                        <div className="w-full bg-foreground/10 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progressPercentage}%` }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            style={{ backgroundColor: aqiLevel.color }}
                            className="h-full rounded-full"
                          />
                        </div>
                      </div>

                      {/* Best time to visit */}
                      <div className="flex items-center justify-between text-xs text-foreground/60">
                        <span>Best time to visit: {bestTime}</span>
                        {ranking.trend && ranking.trend.direction === 'down' && (
                          <span className="text-green-500">Improving</span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map - Enhanced */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold">Pollution Map</h4>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setTimeFilter('24h')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeFilter === '24h'
                    ? 'bg-windows-blue text-white'
                    : 'bg-foreground/10 hover:bg-foreground/20'
                    }`}
                >
                  24h
                </button>
                <button
                  onClick={() => setTimeFilter('7d')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeFilter === '7d'
                    ? 'bg-windows-blue text-white'
                    : 'bg-foreground/10 hover:bg-foreground/20'
                    }`}
                >
                  7d
                </button>
                <button
                  onClick={() => setTimeFilter('30d')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${timeFilter === '30d'
                    ? 'bg-windows-blue text-white'
                    : 'bg-foreground/10 hover:bg-foreground/20'
                    }`}
                >
                  30d
                </button>
              </div>
            </div>
            <div className="w-full h-96 rounded-lg overflow-hidden border border-foreground/20">
              {typeof window !== 'undefined' && (() => {
                // Filter data based on time filter
                const now = new Date();
                const filteredData = pollutionData.filter((item) => {
                  const itemDate = new Date(item.timestamp);
                  const diffMs = now.getTime() - itemDate.getTime();
                  const diffHours = diffMs / (1000 * 60 * 60);

                  if (timeFilter === '24h') return diffHours <= 24;
                  if (timeFilter === '7d') return diffHours <= 24 * 7;
                  return diffHours <= 24 * 30;
                });

                // Calculate average AQI for heatmap intensity
                const avgAQI = filteredData.length > 0
                  ? filteredData.reduce((sum, item) => sum + (item.aqi_value || item.level), 0) / filteredData.length
                  : 0;

                return (
                  <div className="relative">
                    {tilesLoading && (
                      <div className="absolute top-2 right-2 z-[1000] bg-white/80 backdrop-blur rounded-md px-2 py-1 text-xs font-medium shadow-sm flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Loading Map Data...
                      </div>
                    )}
                    <RiskMap
                      onMapMove={(bounds, zoom) => onMapMove(bounds, zoom)}
                      riskZones={[
                        // Combine initial loaded data with tiled data
                        ...filteredData,
                        ...tiledPollutionData.filter(t => !filteredData.find(f => f.id === t.id))
                      ].map((item) => {
                        const aqiLevel = getAQILevel(item.aqi_value || item.level);
                        // Adjust radius based on AQI level for heatmap effect
                        const baseRadius = 0.005;
                        const intensityMultiplier = (item.aqi_value || item.level) / 200; // Scale based on AQI
                        const radius = baseRadius * (1 + intensityMultiplier);

                        return {
                          location: { lat: item.location.lat, lng: item.location.lng },
                          radius,
                          risk_level: aqiLevel.level.includes('Good') ? 'low' :
                            aqiLevel.level.includes('Moderate') ? 'medium' : 'high',
                          incident_count: 1,
                          predicted_issues: [item.pollution_type],
                        };
                      })}
                      incidents={filteredData.map((item) => ({
                        id: item.id,
                        type: item.pollution_type,
                        location: { lat: item.location.lat, lng: item.location.lng },
                        occurred_at: item.timestamp,
                        severity: item.aqi_value && item.aqi_value > 150 ? 'high' :
                          item.aqi_value && item.aqi_value > 100 ? 'medium' : 'low',
                        created_at: item.timestamp || new Date().toISOString(),
                      }))}
                    />
                  </div>
                );
              })()}
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-foreground/60">
              <span>
                Showing {pollutionData.filter((item) => {
                  const now = new Date();
                  const itemDate = new Date(item.timestamp);
                  const diffMs = now.getTime() - itemDate.getTime();
                  const diffHours = diffMs / (1000 * 60 * 60);
                  if (timeFilter === '24h') return diffHours <= 24;
                  if (timeFilter === '7d') return diffHours <= 24 * 7;
                  return diffHours <= 24 * 30;
                }).length} readings from last {timeFilter}
              </span>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>Good</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <span>Moderate</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Unhealthy</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-foreground/70">Total Readings</span>
              </div>
              <div className="text-2xl font-bold">{pollutionData.length}</div>
            </div>
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wind className="w-4 h-4 text-green-500" />
                <span className="text-sm text-foreground/70">User Reports</span>
              </div>
              <div className="text-2xl font-bold">{userReports.length}</div>
            </div>
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-foreground/70">API Data</span>
              </div>
              <div className="text-2xl font-bold">
                {pollutionData.filter((p) => p.source === 'api').length}
              </div>
            </div>
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-foreground/70">Areas Tracked</span>
              </div>
              <div className="text-2xl font-bold">{areaRankings.length}</div>
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

