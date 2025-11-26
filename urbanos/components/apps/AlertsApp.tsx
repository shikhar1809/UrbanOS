'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast-context';
import { AlertTriangle, Plus, MapPin, Clock, AlertCircle, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
    area?: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  start_time?: string;
  end_time?: string;
  is_active: boolean;
  images: string[];
  relief_materials?: {
    locations: Array<{
      lat: number;
      lng: number;
      address: string;
      items: string[];
    }>;
    contact?: {
      name: string;
      phone: string;
      email?: string;
    };
  };
  affected_areas: string[];
  created_at: string;
  agency?: {
    name: string;
    type: string;
  };
}

export default function AlertsApp() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'road_closure' | 'construction' | 'diversion' | 'disaster' | 'flood' | 'relief_material'>('all');

  const isAuthority = profile?.role === 'agency' || profile?.role === 'admin';

  useEffect(() => {
    // Load alerts even when not logged in (for public viewing)
    loadAlerts();
  }, [user]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      
      // First, try to query alerts with the agency join (only if logged in)
      let query;
      if (user) {
        query = supabase
          .from('alerts')
          .select(`
            *,
            agency:agencies(id, name, type)
          `)
          .eq('is_active', true)
          .order('created_at', { ascending: false });
      } else {
        // For public users, query without join (RLS might block agency access)
        query = supabase
          .from('alerts')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        // If the join fails, try without the join
        console.warn('Join query failed, trying without join. Error:', error);
        
        // Check if it's a table not found error or RLS issue
        const errorCode = error.code || '';
        const errorMessage = error.message || String(error);
        
        if (errorCode === '42P01' || errorMessage.includes('does not exist')) {
          console.warn('Alerts table does not exist. Setting empty alerts.');
          setAlerts([]);
          return;
        }
        
        // Try simpler query without filters
        const { data: alertsData, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100);

        if (alertsError) {
          // Properly serialize the error object
          const errorInfo: any = {
            message: alertsError.message || 'Unknown error',
            details: alertsError.details || null,
            hint: alertsError.hint || null,
            code: alertsError.code || null,
          };
          
          // Try to stringify the full error
          try {
            errorInfo.fullError = JSON.stringify(alertsError, Object.getOwnPropertyNames(alertsError));
          } catch (e) {
            errorInfo.fullError = String(alertsError);
          }
          
          console.error('Supabase error loading alerts:', errorInfo);
          // Don't throw - continue with empty array instead
          setAlerts([]);
          return;
        }

        // If we got data without join, fetch agencies separately if needed
        if (alertsData && alertsData.length > 0) {
          const agencyIds = alertsData
            .map(a => a.agency_id)
            .filter(Boolean) as string[];
          
          if (agencyIds.length > 0) {
            const { data: agenciesData } = await supabase
              .from('agencies')
              .select('id, name, type')
              .in('id', agencyIds);

            // Map agencies to alerts
            const alertsWithAgencies = alertsData.map(alert => {
              const agency = agenciesData?.find(a => a.id === alert.agency_id);
              return {
                ...alert,
                agency: agency ? { name: agency.name, type: agency.type } : undefined
              };
            });
            setAlerts(alertsWithAgencies);
          } else {
            setAlerts(alertsData);
          }
        } else {
          setAlerts([]);
        }
      } else {
        setAlerts(data || []);
      }
    } catch (error: any) {
      // Properly serialize the error object
      let errorMessage = 'Unknown error';
      let errorDetails: any = null;
      
      if (error) {
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.message) {
          errorMessage = error.message;
        } else if (error.toString) {
          errorMessage = error.toString();
        }
        
        // Try to get full error details
        try {
          errorDetails = {
            message: error.message || null,
            details: error.details || null,
            code: error.code || null,
            stack: error.stack || null,
            fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
          };
        } catch (e) {
          errorDetails = { raw: String(error) };
        }
      }
      
      console.error('Error loading alerts:', errorDetails || errorMessage);
      showToast(errorMessage, 'error');
      setAlerts([]); // Set empty array on error to prevent UI issues
    } finally {
      setLoading(false);
    }
  };

  const severityColors = {
    low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    high: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
    critical: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const typeIcons: Record<string, any> = {
    road_closure: AlertTriangle,
    construction: AlertCircle,
    diversion: MapPin,
    disaster: AlertTriangle,
    flood: AlertTriangle,
    relief_material: Info,
  };

  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Public Alerts</h1>
          <p className="text-foreground/70">Stay informed about road closures, construction, and emergencies</p>
        </div>
        {isAuthority && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-windows-blue text-white rounded-lg font-medium hover:bg-windows-blue-hover transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Create Alert
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['all', 'road_closure', 'construction', 'diversion', 'disaster', 'flood', 'relief_material'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilter(type)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === type
                ? 'bg-windows-blue text-white'
                : 'bg-foreground/5 hover:bg-foreground/10 text-foreground/70'
            }`}
          >
            {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">No Alerts</h3>
            <p className="text-foreground/70">No active alerts at this time</p>
          </div>
        ) : (
          filteredAlerts.map((alert, index) => {
            const TypeIcon = typeIcons[alert.type] || AlertTriangle;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-foreground/5 rounded-xl p-6 border border-foreground/10 hover:border-foreground/20 transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <TypeIcon className="w-6 h-6 text-orange-500" />
                    <div>
                      <h3 className="text-lg font-semibold mb-1">{alert.title}</h3>
                      {alert.agency && (
                        <p className="text-sm text-foreground/60">{alert.agency.name}</p>
                      )}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${severityColors[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </div>

                <p className="text-foreground/80 mb-4">{alert.description}</p>

                {alert.location && (
                  <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>{alert.location.address}</span>
                  </div>
                )}

                {alert.start_time && alert.end_time && (
                  <div className="flex items-center gap-2 text-sm text-foreground/60 mb-3">
                    <Clock className="w-4 h-4" />
                    <span>
                      {new Date(alert.start_time).toLocaleString()} - {new Date(alert.end_time).toLocaleString()}
                    </span>
                  </div>
                )}

                {alert.relief_materials && alert.relief_materials.locations.length > 0 && (
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-3">
                    <h4 className="font-semibold mb-2 text-blue-500">Relief Material Locations:</h4>
                    <ul className="space-y-2">
                      {alert.relief_materials.locations.map((loc, idx) => (
                        <li key={idx} className="text-sm">
                          <span className="font-medium">{loc.address}:</span> {loc.items.join(', ')}
                        </li>
                      ))}
                    </ul>
                    {alert.relief_materials.contact && (
                      <p className="text-sm mt-2">
                        Contact: {alert.relief_materials.contact.name} - {alert.relief_materials.contact.phone}
                      </p>
                    )}
                  </div>
                )}

                {alert.affected_areas.length > 0 && (
                  <div className="text-sm text-foreground/60">
                    <span className="font-medium">Affected Areas:</span> {alert.affected_areas.join(', ')}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Create Alert Modal - Placeholder for now */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-windows-dark rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-foreground/10">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create Alert</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-foreground/70">Alert creation form will be implemented here</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

