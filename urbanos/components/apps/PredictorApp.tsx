'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Report, RiskZone } from '@/types';
import { MapPin, AlertTriangle, TrendingUp, Clock, Shield, Bell, Calendar, Navigation2, Zap } from 'lucide-react';
import dynamic from 'next/dynamic';

const RiskMap = dynamic(() => import('./predictor/RiskMap'), { ssr: false });

interface PredictedAlert {
  id: string;
  type: 'seasonal' | 'location' | 'pattern' | 'time-based';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  predictedDate?: string;
  location?: { lat: number; lng: number; address: string };
  action?: string;
}

export default function PredictorApp() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [predictedAlerts, setPredictedAlerts] = useState<PredictedAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalIncidents: 0,
    highRiskAreas: 0,
    mostCommonType: '',
    recentTrend: 'stable' as 'increasing' | 'decreasing' | 'stable',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load ALL reports including:
      // 1. Normal reports (pothole, streetlight, garbage, etc.)
      // 2. Cybersecurity alerts (type: 'cybersecurity')
      // Both are stored in the same 'reports' table
      const { data: reportData, error: reportError } = await supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (reportError) throw reportError;

      const allReports = reportData || [];
      setReports(allReports);

      // Log data breakdown for verification
      const normalReports = allReports.filter(r => r.type !== 'cybersecurity');
      const cyberReports = allReports.filter(r => r.type === 'cybersecurity');
      console.log('Predictor data loaded:', {
        total: allReports.length,
        normalReports: normalReports.length,
        cybersecurityAlerts: cyberReports.length,
        breakdown: {
          pothole: allReports.filter(r => r.type === 'pothole').length,
          streetlight: allReports.filter(r => r.type === 'streetlight').length,
          garbage: allReports.filter(r => r.type === 'garbage').length,
          cybersecurity: cyberReports.length,
          other: allReports.filter(r => r.type === 'other').length,
        }
      });

      // Convert ALL reports (normal + cybersecurity) to incidents format for risk zone calculation
      const incidents = allReports.map((report) => ({
        id: report.id,
        type: report.type,
        location: {
          lat: report.location.lat,
          lng: report.location.lng,
        },
        occurred_at: report.created_at,
        severity: report.priority === 'high' ? 'high' : report.priority === 'medium' ? 'medium' : 'low',
      }));

      // Calculate risk zones based on report clustering
      const zones = calculateRiskZones(incidents);
      setRiskZones(zones);

      // Generate predictions using ALL reports (normal + cybersecurity)
      // First try to get AI predictions
      let predictions: PredictedAlert[] = [];
      try {
        const response = await fetch('/api/predictor/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reports: allReports }),
        });
        const data = await response.json();
        if (data.success && Array.isArray(data.predictions) && data.predictions.length > 0) {
          predictions = data.predictions;
        } else {
          // Fallback to hardcoded rules if AI fails or returns empty
          predictions = generatePredictions(allReports, zones);
        }
      } catch (err) {
        console.error('Failed to get AI predictions, falling back to rules:', err);
        predictions = generatePredictions(allReports, zones);
      }

      setPredictedAlerts(predictions);

      // Create notifications for high-priority predictions
      if (user) {
        await createPredictionNotifications(predictions);
      }

      // Calculate stats
      calculateStats(incidents);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRiskZones = (incidents: any[]): RiskZone[] => {
    // Simple clustering algorithm
    const clusters: { [key: string]: any[] } = {};

    incidents.forEach((incident) => {
      if (!incident.location || typeof incident.location.lat !== 'number') return;

      const lat = Math.round(incident.location.lat * 100) / 100;
      const lng = Math.round(incident.location.lng * 100) / 100;
      const key = `${lat},${lng}`;

      if (!clusters[key]) {
        clusters[key] = [];
      }
      clusters[key].push(incident);
    });

    // Convert clusters to risk zones
    const zones: RiskZone[] = Object.entries(clusters).map(([key, clusterIncidents]) => {
      const [lat, lng] = key.split(',').map(Number);
      const count = clusterIncidents.length;
      const highSeverityCount = clusterIncidents.filter((i) => i.severity === 'high').length;

      let risk_level: 'low' | 'medium' | 'high' = 'low';
      if (count >= 5 || highSeverityCount >= 2) {
        risk_level = 'high';
      } else if (count >= 3 || highSeverityCount >= 1) {
        risk_level = 'medium';
      }

      // Get unique issue types
      const types = Array.from(new Set(clusterIncidents.map((i) => i.type)));

      return {
        location: { lat, lng },
        radius: 0.02, // roughly 2km
        risk_level,
        incident_count: count,
        predicted_issues: types,
      };
    });

    return zones.sort((a, b) => b.incident_count - a.incident_count);
  };

  const generatePredictions = (reports: Report[], zones: RiskZone[]): PredictedAlert[] => {
    const predictions: PredictedAlert[] = [];
    const now = new Date();
    const currentMonth = now.getMonth(); // 0-11
    const currentDate = now.getDate();

    // 1. Seasonal/Time-based Predictions
    // Christmas/Holiday Fraud Warning (November-December)
    if (currentMonth === 10 || currentMonth === 11) {
      const daysUntilChristmas = currentMonth === 10
        ? 30 - currentDate + 25
        : 25 - currentDate;

      if (daysUntilChristmas <= 30 && daysUntilChristmas > 0) {
        predictions.push({
          id: 'xmas-fraud',
          type: 'seasonal',
          title: '⚠️ Holiday Fraud Alert',
          description: `With Christmas approaching (${daysUntilChristmas} days away), fraud and scam incidents typically increase by 40-60%. Be extra cautious of: suspicious online shopping deals, fake charity calls, and phishing emails claiming to be from delivery services.`,
          severity: 'high',
          predictedDate: new Date(now.getFullYear(), 11, 25).toISOString(),
          action: 'Verify all online purchases, never share OTPs, and report suspicious activity immediately.',
        });
      }
    }

    // Monsoon Season Pothole Predictions (June-September in India)
    if (currentMonth >= 5 && currentMonth <= 8) {
      const potholeReports = reports.filter(r => r.type === 'pothole');
      if (potholeReports.length > 0) {
        predictions.push({
          id: 'monsoon-potholes',
          type: 'seasonal',
          title: '🌧️ Monsoon Pothole Risk',
          description: 'Heavy monsoon rains are expected to cause new potholes and worsen existing ones. Areas with recent pothole reports are at higher risk. Road accessibility may be affected.',
          severity: 'medium',
          action: 'Plan alternative routes, drive carefully, and report new potholes immediately.',
        });
      }
    }

    // 2. Location-based Predictions (High-risk zones)
    const highRiskZones = zones.filter(z => z.risk_level === 'high');
    highRiskZones.slice(0, 3).forEach((zone, index) => {
      const recentReports = reports.filter(r => {
        const lat = Math.round(r.location.lat * 100) / 100;
        const lng = Math.round(r.location.lng * 100) / 100;
        return Math.abs(lat - zone.location.lat) < 0.01 && Math.abs(lng - zone.location.lng) < 0.01;
      });

      if (recentReports.length > 0) {
        const mostCommonType = recentReports.reduce((acc, r) => {
          acc[r.type] = (acc[r.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const topType = Object.entries(mostCommonType).sort((a, b) => b[1] - a[1])[0]?.[0] || 'issues';

        predictions.push({
          id: `high-risk-zone-${index}`,
          type: 'location',
          title: `🚨 High-Risk Area Alert`,
          description: `This area (${zone.location.lat.toFixed(4)}, ${zone.location.lng.toFixed(4)}) has ${zone.incident_count} recent incidents, primarily ${topType}. Based on historical patterns, similar issues are likely to occur here again soon.`,
          severity: 'high',
          location: {
            lat: zone.location.lat,
            lng: zone.location.lng,
            address: recentReports[0]?.location.address || 'High-risk area',
          },
          action: 'Avoid this area if possible, or be extra vigilant when passing through.',
        });
      }
    });

    // 3. Pattern-based Predictions
    // Road Accessibility Issues
    const roadReports = reports.filter(r =>
      r.type === 'pothole' || r.type === 'road_safety_hazards'
    );
    if (roadReports.length >= 3) {
      const recentRoadReports = roadReports.filter(r => {
        const reportDate = new Date(r.created_at);
        const daysAgo = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 7;
      });

      if (recentRoadReports.length >= 2) {
        predictions.push({
          id: 'road-accessibility',
          type: 'pattern',
          title: '🛣️ Road Accessibility Warning',
          description: `Multiple road issues reported in the past week. Some roads may become inaccessible or dangerous. Check alternative routes before traveling.`,
          severity: 'medium',
          action: 'Check road conditions before traveling and report any new road hazards.',
        });
      }
    }

    // Cybersecurity Pattern - Using cybersecurity alerts from reports table
    const cyberReports = reports.filter(r => r.type === 'cybersecurity');
    console.log('Cybersecurity reports for prediction:', cyberReports.length);
    if (cyberReports.length >= 5) {
      const recentCyber = cyberReports.filter(r => {
        const reportDate = new Date(r.created_at);
        const daysAgo = (now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysAgo <= 14;
      });

      if (recentCyber.length >= 3) {
        predictions.push({
          id: 'cyber-surge',
          type: 'pattern',
          title: '🛡️ Cybersecurity Threat Surge',
          description: `Increased cybersecurity incidents detected in the area. Be extra cautious with online transactions, emails, and phone calls.`,
          severity: 'high',
          action: 'Enable two-factor authentication, verify all communications, and report suspicious activity.',
        });
      }
    }

    // 4. Time-based Predictions (Weekend/Evening patterns)
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // Weekend traffic/accessibility issues
    if ((dayOfWeek === 5 || dayOfWeek === 6) && hour >= 17) {
      const trafficReports = reports.filter(r =>
        r.type === 'pothole' || r.type === 'road_safety_hazards'
      );
      if (trafficReports.length > 0) {
        predictions.push({
          id: 'weekend-traffic',
          type: 'time-based',
          title: '🚦 Weekend Traffic Alert',
          description: 'Weekend evenings typically see increased traffic and road issues. Plan for longer travel times and potential road closures.',
          severity: 'low',
          action: 'Plan routes in advance and allow extra travel time.',
        });
      }
    }

    return predictions.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  };

  const createPredictionNotifications = async (predictions: PredictedAlert[]) => {
    if (!user) return;

    try {
      // Only create notifications for high and medium severity predictions
      const importantPredictions = predictions.filter(p =>
        p.severity === 'high' || p.severity === 'medium'
      );

      for (const prediction of importantPredictions) {
        // Check if notification already exists
        const { data: existing } = await supabase
          .from('notifications')
          .select('id')
          .eq('user_id', user.id)
          .eq('type', 'security_alert')
          .eq('title', prediction.title)
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from('notifications').insert({
            user_id: user.id,
            type: 'security_alert',
            title: prediction.title,
            message: prediction.description + (prediction.action ? `\n\nAction: ${prediction.action}` : ''),
          });
        }
      }
    } catch (error) {
      console.error('Error creating prediction notifications:', error);
    }
  };

  const calculateStats = (incidents: any[]) => {
    const totalIncidents = incidents.length;
    const highRiskAreas = riskZones.filter((z) => z.risk_level === 'high').length;

    // Find most common type
    const typeCounts: { [key: string]: number } = {};
    incidents.forEach((i) => {
      typeCounts[i.type] = (typeCounts[i.type] || 0) + 1;
    });
    const mostCommonType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

    // Determine trend (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentIncidents = incidents.filter(
      (i) => new Date(i.occurred_at) >= thirtyDaysAgo
    ).length;
    const previousIncidents = incidents.filter(
      (i) =>
        new Date(i.occurred_at) >= sixtyDaysAgo && new Date(i.occurred_at) < thirtyDaysAgo
    ).length;

    let recentTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (recentIncidents > previousIncidents * 1.2) {
      recentTrend = 'increasing';
    } else if (recentIncidents < previousIncidents * 0.8) {
      recentTrend = 'decreasing';
    }

    setStats({
      totalIncidents,
      highRiskAreas,
      mostCommonType,
      recentTrend,
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl font-bold mb-2">Issue Predictor</h3>
          <p className="text-sm text-foreground/70">
            AI-powered predictions to help you avoid problems before they happen
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Predicted Alerts - Most Important Section */}
          {predictedAlerts.length > 0 && (
            <div className="bg-foreground/5 rounded-xl p-6 border-2 border-yellow-500/30">
              <div className="flex items-center gap-2 mb-4">
                <Bell className="w-5 h-5 text-yellow-500" />
                <h4 className="text-lg font-semibold">🔮 Predicted Alerts</h4>
                <span className="px-2 py-1 bg-yellow-500/20 text-yellow-500 rounded-full text-xs font-medium">
                  {predictedAlerts.length} Active
                </span>
              </div>
              <div className="space-y-3">
                {predictedAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-lg border-2 ${alert.severity === 'high'
                        ? 'bg-red-500/10 border-red-500/30'
                        : alert.severity === 'medium'
                          ? 'bg-yellow-500/10 border-yellow-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded ${alert.severity === 'high'
                          ? 'bg-red-500/20'
                          : alert.severity === 'medium'
                            ? 'bg-yellow-500/20'
                            : 'bg-blue-500/20'
                        }`}>
                        {alert.type === 'seasonal' && <Calendar className="w-4 h-4" />}
                        {alert.type === 'location' && <MapPin className="w-4 h-4" />}
                        {alert.type === 'pattern' && <TrendingUp className="w-4 h-4" />}
                        {alert.type === 'time-based' && <Clock className="w-4 h-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h5 className="font-semibold">{alert.title}</h5>
                          <span className={`px-2 py-0.5 rounded text-xs ${alert.severity === 'high'
                              ? 'bg-red-500/20 text-red-500'
                              : alert.severity === 'medium'
                                ? 'bg-yellow-500/20 text-yellow-500'
                                : 'bg-blue-500/20 text-blue-500'
                            }`}>
                            {alert.severity.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/70 mb-2">{alert.description}</p>
                        {alert.action && (
                          <div className="mt-2 p-2 bg-foreground/5 rounded text-xs">
                            <strong>Recommended Action:</strong> {alert.action}
                          </div>
                        )}
                        {alert.predictedDate && (
                          <div className="mt-2 text-xs text-foreground/60">
                            Expected: {new Date(alert.predictedDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-foreground/5 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-foreground/70">Total Reports</span>
              </div>
              <div className="text-2xl font-bold">{stats.totalIncidents}</div>
            </div>
            <div className="bg-red-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-foreground/70">High Risk Areas</span>
              </div>
              <div className="text-2xl font-bold">{stats.highRiskAreas}</div>
            </div>
            <div className="bg-purple-500/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-foreground/70">Most Common</span>
              </div>
              <div className="text-lg font-bold capitalize">{stats.mostCommonType}</div>
            </div>
            <div className={`rounded-xl p-4 ${stats.recentTrend === 'increasing'
                ? 'bg-red-500/10'
                : stats.recentTrend === 'decreasing'
                  ? 'bg-green-500/10'
                  : 'bg-foreground/5'
              }`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${stats.recentTrend === 'increasing'
                    ? 'text-red-500'
                    : stats.recentTrend === 'decreasing'
                      ? 'text-green-500'
                      : 'text-foreground/50'
                  }`} />
                <span className="text-sm text-foreground/70">Trend</span>
              </div>
              <div className="text-lg font-bold capitalize">{stats.recentTrend}</div>
            </div>
          </div>

          {/* Map */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <h4 className="text-lg font-semibold mb-4">Risk Zones Map</h4>
            <RiskMap riskZones={riskZones} incidents={reports.map(r => ({
              id: r.id,
              type: r.type,
              location: { lat: r.location.lat, lng: r.location.lng },
              occurred_at: r.created_at,
              severity: r.priority === 'high' ? 'high' : r.priority === 'medium' ? 'medium' : 'low',
              created_at: r.created_at,
            }))} />
          </div>

          {/* Risk Zones List */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <h4 className="text-lg font-semibold mb-4">High-Risk Areas</h4>
            <div className="space-y-3">
              {riskZones
                .filter((zone) => zone.risk_level === 'high')
                .slice(0, 10)
                .map((zone, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-red-500/5 border border-red-500/20 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="font-semibold">
                          Area {index + 1}: {zone.location.lat.toFixed(4)}, {zone.location.lng.toFixed(4)}
                        </span>
                      </div>
                      <div className="text-sm text-foreground/70">
                        {zone.incident_count} incidents - Types: {zone.predicted_issues.join(', ')}
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-red-500/20 text-red-500 rounded-full text-xs font-medium">
                      High Risk
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
