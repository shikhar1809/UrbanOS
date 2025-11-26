'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { fetchAQIData, getAQILevel } from '@/lib/services/pollution-api';
import { PollutionData, Report } from '@/types';
import { MapPin, AlertTriangle, TrendingUp, RefreshCw, Wind } from 'lucide-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

const RiskMap = dynamic(() => import('./predictor/RiskMap'), { ssr: false });

export default function PollutionApp() {
  const [pollutionData, setPollutionData] = useState<PollutionData[]>([]);
  const [userReports, setUserReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [areaRankings, setAreaRankings] = useState<Array<{ area: string; count: number; avgLevel: number }>>([]);

  useEffect(() => {
    loadData();
    // Refresh AQI data every 30 minutes
    const interval = setInterval(() => {
      refreshAQIData();
    }, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load pollution data from database
      const { data: pollutionRes, error: pollutionError } = await supabase
        .from('pollution_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(100);

      if (pollutionError) throw pollutionError;

      // Load environmental reports from reports table
      const { data: reportsRes, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .eq('type', 'environmental')
        .order('created_at', { ascending: false })
        .limit(50);

      if (reportsError) throw reportsError;

      setPollutionData(pollutionRes || []);
      setUserReports(reportsRes || []);

      // Convert user reports to pollution data format if not already in pollution_data
      await syncUserReportsToPollutionData(reportsRes || []);

      // Calculate area rankings
      calculateAreaRankings(pollutionRes || []);

      // Fetch fresh AQI data
      await refreshAQIData();
    } catch (error) {
      console.error('Error loading pollution data:', error);
    } finally {
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

  const refreshAQIData = async () => {
    setRefreshing(true);
    try {
      const aqiData = await fetchAQIData('lucknow');
      if (aqiData && aqiData.city) {
        // Store AQI data
        await supabase.from('pollution_data').insert({
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
        });

        // Reload data
        await loadData();
      }
    } catch (error) {
      console.error('Error refreshing AQI data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const calculateAreaRankings = (data: PollutionData[]) => {
    const areaMap = new Map<string, { count: number; totalLevel: number }>();

    data.forEach((item) => {
      const area = item.location.area_name || item.location.address || 'Unknown';
      const existing = areaMap.get(area) || { count: 0, totalLevel: 0 };
      areaMap.set(area, {
        count: existing.count + 1,
        totalLevel: existing.totalLevel + item.level,
      });
    });

    const rankings = Array.from(areaMap.entries())
      .map(([area, stats]) => ({
        area,
        count: stats.count,
        avgLevel: stats.totalLevel / stats.count,
      }))
      .sort((a, b) => b.avgLevel - a.avgLevel)
      .slice(0, 10);

    setAreaRankings(rankings);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
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
          {/* Area Rankings */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h4 className="text-lg font-semibold">Most Polluted Areas</h4>
            </div>
            {areaRankings.length === 0 ? (
              <p className="text-sm text-foreground/70">No pollution data available yet</p>
            ) : (
              <div className="space-y-2">
                {areaRankings.map((ranking, index) => {
                  const aqiLevel = getAQILevel(ranking.avgLevel);
                  return (
                    <motion.div
                      key={ranking.area}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: aqiLevel.color }}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{ranking.area}</p>
                          <p className="text-xs text-foreground/60">
                            {ranking.count} readings • Avg: {ranking.avgLevel.toFixed(0)} AQI
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold" style={{ color: aqiLevel.color }}>
                          {aqiLevel.level}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Map */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <h4 className="text-lg font-semibold mb-4">Pollution Map</h4>
            <div className="w-full h-96 rounded-lg overflow-hidden border border-foreground/20">
              {typeof window !== 'undefined' && (
                <RiskMap
                  riskZones={pollutionData.map((item) => {
                    const aqiLevel = getAQILevel(item.aqi_value || item.level);
                    return {
                      location: { lat: item.location.lat, lng: item.location.lng },
                      radius: 0.005,
                      risk_level: aqiLevel.level.includes('Good') ? 'low' : 
                                  aqiLevel.level.includes('Moderate') ? 'medium' : 'high',
                      incident_count: 1,
                      predicted_issues: [item.pollution_type],
                    };
                  })}
                  incidents={pollutionData.map((item) => ({
                    id: item.id,
                    type: item.pollution_type,
                    location: { lat: item.location.lat, lng: item.location.lng },
                    occurred_at: item.timestamp,
                    severity: item.aqi_value && item.aqi_value > 150 ? 'high' : 
                              item.aqi_value && item.aqi_value > 100 ? 'medium' : 'low',
                  }))}
                />
              )}
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
    </div>
  );
}

