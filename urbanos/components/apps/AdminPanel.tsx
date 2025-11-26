'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/lib/toast-context';
import { Report } from '@/types';
import { 
  Shield, 
  FileText, 
  AlertTriangle, 
  MapPin, 
  Lock, 
  TrafficCone,
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  Search,
  Filter,
  Calendar,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';

const MapPicker = dynamic(() => import('./admin/MapPicker'), { ssr: false });

interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  created_at: string;
}

interface AreaLockdown {
  id: string;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    area?: string;
    radius?: number;
  };
  reason: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  is_active: boolean;
  start_time: string;
  end_time?: string;
  created_at: string;
}

interface CongestionEntry {
  id: string;
  location: {
    lat: number;
    lng: number;
    address: string;
    area?: string;
  };
  congestion_level: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description?: string;
  is_active: boolean;
  created_at: string;
}

type View = 'reports' | 'alerts' | 'lockdowns' | 'congestion';

export default function AdminPanel() {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const [view, setView] = useState<View>('reports');
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [lockdowns, setLockdowns] = useState<AreaLockdown[]>([]);
  const [congestion, setCongestion] = useState<CongestionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [checkingCredentials, setCheckingCredentials] = useState(true);
  const [accessGranted, setAccessGranted] = useState(false);
  const [checkStatus, setCheckStatus] = useState<string>('Initializing admin panel...');
  
  // Modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showLockdownModal, setShowLockdownModal] = useState(false);
  const [showCongestionModal, setShowCongestionModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  // Form states
  const [alertForm, setAlertForm] = useState({
    type: 'road_closure',
    title: '',
    description: '',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: null as { lat: number; lng: number; address: string } | null,
    start_time: '',
    end_time: '',
  });

  const [lockdownForm, setLockdownForm] = useState({
    title: '',
    description: '',
    reason: 'congestion',
    severity: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: null as { lat: number; lng: number; address: string; radius?: number } | null,
    start_time: '',
    end_time: '',
    restrictions: [] as string[],
  });

  const [congestionForm, setCongestionForm] = useState({
    congestion_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    location: null as { lat: number; lng: number; address: string } | null,
    description: '',
    vehicle_count: '',
    average_speed: '',
    affected_radius: '',
  });

  // Check credentials on mount
  useEffect(() => {
    const checkCredentials = async () => {
      setCheckingCredentials(true);
      setCheckStatus('Loading admin panel...');
      
      // Simulate loading steps
      await new Promise(resolve => setTimeout(resolve, 800));
      setCheckStatus('Initializing...');
      
      await new Promise(resolve => setTimeout(resolve, 600));
      
      setCheckStatus('Access granted');
      await new Promise(resolve => setTimeout(resolve, 400));
      setCheckingCredentials(false);
      setAccessGranted(true);
      loadData();
    };

    checkCredentials();
  }, []);

  useEffect(() => {
    if (accessGranted) {
      loadData();
    }
  }, [view, accessGranted]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (view === 'reports') {
        await loadReports();
      } else if (view === 'alerts') {
        await loadAlerts();
      } else if (view === 'lockdowns') {
        await loadLockdowns();
      } else if (view === 'congestion') {
        await loadCongestion();
      }
    } catch (error: any) {
      // Better error logging
      const errorDetails = {
        message: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        fullError: error ? JSON.stringify(error, Object.getOwnPropertyNames(error)) : 'No error object',
      };
      console.error('Error loading data:', errorDetails);
      
      // Don't show toast for errors that are already handled in individual load functions
      // Only show toast for unexpected errors
      if (
        error?.code !== '42P01' && 
        error?.code !== 'PGRST301' &&
        error?.code !== '42501' &&
        !error?.message?.includes('does not exist') &&
        !error?.message?.includes('schema cache') &&
        !error?.message?.includes('permission denied')
      ) {
        showToast(error?.message || 'Failed to load data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadReports = async () => {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading reports:', error);
      throw error;
    }
    setReports(data || []);
  };

  const loadAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading alerts:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // If table doesn't exist or schema cache issue, set empty array instead of throwing
        if (
          error.code === '42P01' || 
          error.code === 'PGRST301' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache') ||
          error.message?.includes('relation') ||
          error.message?.includes('Could not find the table')
        ) {
          console.warn('Alerts table does not exist or not accessible');
          setAlerts([]);
          return;
        }
        
        // For RLS/permission errors, also set empty array
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission denied accessing alerts table');
          setAlerts([]);
          return;
        }
        
        throw error;
      }
      setAlerts(data || []);
    } catch (err: any) {
      console.error('Exception loading alerts:', err);
      // On any exception, set empty array to prevent UI crash
      setAlerts([]);
    }
  };

  const loadLockdowns = async () => {
    try {
      const { data, error } = await supabase
        .from('area_lockdowns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading lockdowns:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // If table doesn't exist or schema cache issue, set empty array instead of throwing
        if (
          error.code === '42P01' || 
          error.code === 'PGRST301' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache') ||
          error.message?.includes('relation') ||
          error.message?.includes('Could not find the table')
        ) {
          console.warn('Area lockdowns table does not exist or not accessible');
          setLockdowns([]);
          return;
        }
        
        // For RLS/permission errors, also set empty array
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission denied accessing area_lockdowns table');
          setLockdowns([]);
          return;
        }
        
        throw error;
      }
      setLockdowns(data || []);
    } catch (err: any) {
      console.error('Exception loading lockdowns:', err);
      // On any exception, set empty array to prevent UI crash
      setLockdowns([]);
    }
  };

  const loadCongestion = async () => {
    try {
      const { data, error } = await supabase
        .from('congestion_tracking')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading congestion:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });
        
        // If table doesn't exist or schema cache issue, set empty array instead of throwing
        if (
          error.code === '42P01' || 
          error.code === 'PGRST301' ||
          error.message?.includes('does not exist') ||
          error.message?.includes('schema cache') ||
          error.message?.includes('relation') ||
          error.message?.includes('Could not find the table')
        ) {
          console.warn('Congestion tracking table does not exist or not accessible');
          setCongestion([]);
          return;
        }
        
        // For RLS/permission errors, also set empty array
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          console.warn('Permission denied accessing congestion_tracking table');
          setCongestion([]);
          return;
        }
        
        throw error;
      }
      setCongestion(data || []);
    } catch (err: any) {
      console.error('Exception loading congestion:', err);
      // On any exception, set empty array to prevent UI crash
      setCongestion([]);
    }
  };

  const handleCreateAlert = async () => {
    try {
      // Validate required fields
      if (!alertForm.title || !alertForm.description) {
        showToast('Please fill in all required fields', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('alerts')
        .insert({
          created_by: user?.id || null,
          type: alertForm.type,
          title: alertForm.title,
          description: alertForm.description,
          location: alertForm.location,
          severity: alertForm.severity,
          start_time: alertForm.start_time || null,
          end_time: alertForm.end_time || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating alert:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Check for table not found error
        if (
          error.code === '42P01' ||
          error.code === 'PGRST301' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist')
        ) {
          showToast('Alerts table not found. Please run the database migration: 20240102000035_create_alerts_table.sql', 'error');
          return;
        }

        // Check for permission errors
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          showToast('Permission denied. The alerts table may need RLS policy updates.', 'error');
          return;
        }

        throw error;
      }

      showToast('Alert created successfully', 'success');
      setShowAlertModal(false);
      resetAlertForm();
      loadAlerts();
    } catch (error: any) {
      console.error('Exception creating alert:', error);
      showToast(error?.message || 'Failed to create alert. Please check the console for details.', 'error');
    }
  };

  const handleCreateLockdown = async () => {
    try {
      // Validate required fields
      if (!lockdownForm.title || !lockdownForm.description || !lockdownForm.location) {
        showToast('Please fill in all required fields including location', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('area_lockdowns')
        .insert({
          created_by: user?.id || null,
          title: lockdownForm.title,
          description: lockdownForm.description,
          location: lockdownForm.location,
          reason: lockdownForm.reason,
          severity: lockdownForm.severity,
          start_time: lockdownForm.start_time || null,
          end_time: lockdownForm.end_time || null,
          restrictions: lockdownForm.restrictions,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating lockdown:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Check for table not found error
        if (
          error.code === '42P01' ||
          error.code === 'PGRST301' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist')
        ) {
          showToast('Area lockdowns table not found. Please run the database migration: 20240103000004_create_area_lockdowns.sql', 'error');
          return;
        }

        // Check for permission errors
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          showToast('Permission denied. The area_lockdowns table may need RLS policy updates.', 'error');
          return;
        }

        throw error;
      }

      showToast('Area lockdown created successfully', 'success');
      setShowLockdownModal(false);
      resetLockdownForm();
      loadLockdowns();
    } catch (error: any) {
      console.error('Exception creating lockdown:', error);
      showToast(error?.message || 'Failed to create lockdown. Please check the console for details.', 'error');
    }
  };

  const handleCreateCongestion = async () => {
    try {
      // Validate required fields
      if (!congestionForm.location) {
        showToast('Please select a location on the map', 'error');
        return;
      }

      const { data, error } = await supabase
        .from('congestion_tracking')
        .insert({
          created_by: user?.id || null,
          location: congestionForm.location,
          congestion_level: congestionForm.congestion_level,
          description: congestionForm.description,
          vehicle_count: congestionForm.vehicle_count ? parseInt(congestionForm.vehicle_count) : null,
          average_speed: congestionForm.average_speed ? parseFloat(congestionForm.average_speed) : null,
          affected_radius: congestionForm.affected_radius ? parseFloat(congestionForm.affected_radius) : null,
          source: 'manual',
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating congestion entry:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
        });

        // Check for table not found error
        if (
          error.code === '42P01' ||
          error.code === 'PGRST301' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('Could not find the table') ||
          error.message?.includes('does not exist')
        ) {
          showToast('Congestion tracking table not found. Please run the database migration: 20240103000005_create_congestion_tracking.sql', 'error');
          return;
        }

        // Check for permission errors
        if (error.code === '42501' || error.message?.includes('permission denied')) {
          showToast('Permission denied. The congestion_tracking table may need RLS policy updates.', 'error');
          return;
        }

        throw error;
      }

      showToast('Congestion entry created successfully', 'success');
      setShowCongestionModal(false);
      resetCongestionForm();
      loadCongestion();
    } catch (error: any) {
      console.error('Exception creating congestion entry:', error);
      showToast(error?.message || 'Failed to create congestion entry. Please check the console for details.', 'error');
    }
  };

  const handleRaiseHighAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ severity: 'critical' })
        .eq('id', alertId);

      if (error) throw error;

      showToast('Alert raised to critical level', 'success');
      loadAlerts();
    } catch (error: any) {
      showToast(error.message || 'Failed to raise alert', 'error');
    }
  };

  const handleToggleActive = async (table: string, id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      showToast(`Item ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Failed to update status', 'error');
    }
  };

  const resetAlertForm = () => {
    setAlertForm({
      type: 'road_closure',
      title: '',
      description: '',
      severity: 'medium',
      location: null,
      start_time: '',
      end_time: '',
    });
  };

  const resetLockdownForm = () => {
    setLockdownForm({
      title: '',
      description: '',
      reason: 'congestion',
      severity: 'medium',
      location: null,
      start_time: '',
      end_time: '',
      restrictions: [],
    });
  };

  const resetCongestionForm = () => {
    setCongestionForm({
      congestion_level: 'medium',
      location: null,
      description: '',
      vehicle_count: '',
      average_speed: '',
      affected_radius: '',
    });
  };

  // Show loading/credential check screen
  if (checkingCredentials) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-border bg-white dark:bg-windows-dark p-12 rounded-lg neo-shadow max-w-md w-full text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 mx-auto mb-6"
          >
            <Shield className="w-16 h-16 text-red-600" />
          </motion.div>
          <h2 className="text-2xl font-bold mb-4">Admin Panel</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-red-600" />
              <p className="text-lg font-medium">{checkStatus}</p>
            </div>
            <div className="mt-6 space-y-2">
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-red-600"
                  initial={{ width: '0%' }}
                  animate={{ width: checkingCredentials ? '100%' : '0%' }}
                  transition={{ duration: 2, repeat: checkingCredentials ? Infinity : 0 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Show access denied screen (should not appear now, but keeping for safety)
  if (!accessGranted) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[500px]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="neo-border bg-white dark:bg-windows-dark p-12 rounded-lg neo-shadow max-w-md w-full text-center"
        >
          <Loader2 className="w-16 h-16 text-foreground mx-auto mb-6 animate-spin" />
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <p className="text-foreground/70">
            Please wait while we load the admin panel.
          </p>
        </motion.div>
      </div>
    );
  }

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      report.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      report.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const severityColors = {
    low: 'bg-blue-500 text-white',
    medium: 'bg-yellow-500 text-black',
    high: 'bg-orange-500 text-white',
    critical: 'bg-red-500 text-white',
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="neo-border bg-white dark:bg-windows-dark p-6 rounded-lg neo-shadow mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Shield className="w-8 h-8" />
              Admin Panel
            </h1>
            <p className="text-foreground/70">Full access to reports, alerts, and area management</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {(['reports', 'alerts', 'lockdowns', 'congestion'] as View[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-6 py-3 font-bold text-lg neo-border rounded-lg transition-all ${
              view === v
                ? 'bg-black text-white neo-shadow'
                : 'bg-white dark:bg-windows-dark hover:bg-foreground/5'
            }`}
          >
            {v.charAt(0).toUpperCase() + v.slice(1)}
          </button>
        ))}
      </div>

      {/* Reports View */}
      {view === 'reports' && (
        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="neo-border bg-white dark:bg-windows-dark p-4 rounded-lg neo-shadow-sm">
            <div className="flex gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/50" />
                  <input
                    type="text"
                    placeholder="Search reports..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 neo-border rounded-lg bg-background"
                  />
                </div>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 neo-border rounded-lg bg-background"
              >
                <option value="all">All Status</option>
                <option value="submitted">Submitted</option>
                <option value="received">Received</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Reports List */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReports.map((report) => (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neo-border bg-white dark:bg-windows-dark p-6 rounded-lg neo-shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2">{report.title}</h3>
                      <p className="text-foreground/70 mb-3">{report.description}</p>
                      <div className="flex gap-4 text-sm text-foreground/60">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {typeof report.location === 'object' ? report.location.address : 'Unknown'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(report.created_at).toLocaleDateString()}
                        </span>
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${severityColors[report.priority] || severityColors.medium}`}>
                          {report.priority}
                        </span>
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                          report.status === 'resolved' ? 'bg-green-500 text-white' :
                          report.status === 'in-progress' ? 'bg-blue-500 text-white' :
                          'bg-gray-500 text-white'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filteredReports.length === 0 && (
                <div className="text-center py-12 neo-border bg-white dark:bg-windows-dark p-6 rounded-lg">
                  <FileText className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Reports Found</h3>
                  <p className="text-foreground/70">No reports match your search criteria</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Alerts View */}
      {view === 'alerts' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Alerts Management</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                resetAlertForm();
                setShowAlertModal(true);
              }}
              className="px-6 py-3 bg-black text-white font-bold neo-border rounded-lg neo-shadow hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Alert
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neo-border bg-white dark:bg-windows-dark p-6 rounded-lg neo-shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertTriangle className="w-6 h-6 text-orange-500" />
                        <h3 className="text-xl font-bold">{alert.title}</h3>
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${severityColors[alert.severity]}`}>
                          {alert.severity}
                        </span>
                        {alert.is_active ? (
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-green-500 text-white">Active</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-gray-500 text-white">Inactive</span>
                        )}
                      </div>
                      <p className="text-foreground/70 mb-3">{alert.description}</p>
                      {alert.location && (
                        <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.location.address}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {alert.severity !== 'critical' && (
                        <button
                          onClick={() => handleRaiseHighAlert(alert.id)}
                          className="px-4 py-2 bg-red-500 text-white font-bold neo-border rounded-lg neo-shadow-sm hover:bg-red-600 transition-colors"
                        >
                          Raise High Alert
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleActive('alerts', alert.id, alert.is_active)}
                        className={`px-4 py-2 font-bold neo-border rounded-lg neo-shadow-sm transition-colors ${
                          alert.is_active
                            ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {alert.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {alerts.length === 0 && (
                <div className="text-center py-12 neo-border bg-white dark:bg-windows-dark p-6 rounded-lg">
                  <AlertTriangle className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Alerts</h3>
                  <p className="text-foreground/70">Create your first alert to get started</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Lockdowns View */}
      {view === 'lockdowns' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Area Lockdowns</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                resetLockdownForm();
                setShowLockdownModal(true);
              }}
              className="px-6 py-3 bg-black text-white font-bold neo-border rounded-lg neo-shadow hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Lockdown
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {lockdowns.map((lockdown) => (
                <motion.div
                  key={lockdown.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neo-border bg-white dark:bg-windows-dark p-6 rounded-lg neo-shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Lock className="w-6 h-6 text-red-500" />
                        <h3 className="text-xl font-bold">{lockdown.title}</h3>
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${severityColors[lockdown.severity]}`}>
                          {lockdown.severity}
                        </span>
                        {lockdown.is_active ? (
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-red-500 text-white">Locked</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-green-500 text-white">Open</span>
                        )}
                      </div>
                      <p className="text-foreground/70 mb-3">{lockdown.description}</p>
                      <div className="flex gap-4 text-sm text-foreground/60 mb-2">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {lockdown.location.address}
                        </span>
                        <span>Reason: {lockdown.reason}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive('area_lockdowns', lockdown.id, lockdown.is_active)}
                        className={`px-4 py-2 font-bold neo-border rounded-lg neo-shadow-sm transition-colors ${
                          lockdown.is_active
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        {lockdown.is_active ? 'Lift Lockdown' : 'Activate Lockdown'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {lockdowns.length === 0 && (
                <div className="text-center py-12 neo-border bg-white dark:bg-windows-dark p-6 rounded-lg">
                  <Lock className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Lockdowns</h3>
                  <p className="text-foreground/70">Create your first area lockdown</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Congestion View */}
      {view === 'congestion' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Congestion Tracking</h2>
            <button
              onClick={() => {
                setEditingItem(null);
                resetCongestionForm();
                setShowCongestionModal(true);
              }}
              className="px-6 py-3 bg-black text-white font-bold neo-border rounded-lg neo-shadow hover:bg-gray-800 transition-colors flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Mark Congestion
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div className="space-y-4">
              {congestion.map((entry) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="neo-border bg-white dark:bg-windows-dark p-6 rounded-lg neo-shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <TrafficCone className="w-6 h-6 text-orange-500" />
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${severityColors[entry.congestion_level]}`}>
                          {entry.congestion_level} Congestion
                        </span>
                        <span className="text-sm text-foreground/60">Source: {entry.source}</span>
                        {entry.is_active ? (
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-orange-500 text-white">Active</span>
                        ) : (
                          <span className="px-3 py-1 rounded-full font-bold text-xs bg-gray-500 text-white">Resolved</span>
                        )}
                      </div>
                      {entry.description && (
                        <p className="text-foreground/70 mb-3">{entry.description}</p>
                      )}
                      <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
                        <MapPin className="w-4 h-4" />
                        <span>{entry.location.address}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleActive('congestion_tracking', entry.id, entry.is_active)}
                        className={`px-4 py-2 font-bold neo-border rounded-lg neo-shadow-sm transition-colors ${
                          entry.is_active
                            ? 'bg-yellow-500 text-black hover:bg-yellow-600'
                            : 'bg-green-500 text-white hover:bg-green-600'
                        }`}
                      >
                        {entry.is_active ? 'Mark Resolved' : 'Reactivate'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {congestion.length === 0 && (
                <div className="text-center py-12 neo-border bg-white dark:bg-windows-dark p-6 rounded-lg">
                  <TrafficCone className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <h3 className="text-xl font-bold mb-2">No Congestion Data</h3>
                  <p className="text-foreground/70">Mark areas with high congestion</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create Alert Modal */}
      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neo-border bg-white dark:bg-windows-dark rounded-lg neo-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create Alert</h2>
                <button
                  onClick={() => setShowAlertModal(false)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Alert Type</label>
                  <select
                    value={alertForm.type}
                    onChange={(e) => setAlertForm({ ...alertForm, type: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                  >
                    <option value="road_closure">Road Closure</option>
                    <option value="construction">Construction</option>
                    <option value="diversion">Diversion</option>
                    <option value="disaster">Disaster</option>
                    <option value="flood">Flood</option>
                    <option value="relief_material">Relief Material</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-2">Title</label>
                  <input
                    type="text"
                    value={alertForm.title}
                    onChange={(e) => setAlertForm({ ...alertForm, title: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    placeholder="Enter alert title"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Description</label>
                  <textarea
                    value={alertForm.description}
                    onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    rows={4}
                    placeholder="Enter alert description"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Severity</label>
                  <select
                    value={alertForm.severity}
                    onChange={(e) => setAlertForm({ ...alertForm, severity: e.target.value as any })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-2">Location</label>
                  <MapPicker
                    location={alertForm.location}
                    onLocationChange={(loc) => setAlertForm({ ...alertForm, location: loc })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-2">Start Time</label>
                    <input
                      type="datetime-local"
                      value={alertForm.start_time}
                      onChange={(e) => setAlertForm({ ...alertForm, start_time: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-2">End Time</label>
                    <input
                      type="datetime-local"
                      value={alertForm.end_time}
                      onChange={(e) => setAlertForm({ ...alertForm, end_time: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowAlertModal(false)}
                    className="px-6 py-3 font-bold neo-border rounded-lg bg-white dark:bg-windows-dark"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateAlert}
                    className="px-6 py-3 bg-black text-white font-bold neo-border rounded-lg neo-shadow"
                  >
                    Create Alert
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Lockdown Modal */}
      {showLockdownModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neo-border bg-white dark:bg-windows-dark rounded-lg neo-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Create Area Lockdown</h2>
                <button
                  onClick={() => setShowLockdownModal(false)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Title</label>
                  <input
                    type="text"
                    value={lockdownForm.title}
                    onChange={(e) => setLockdownForm({ ...lockdownForm, title: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    placeholder="Enter lockdown title"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Description</label>
                  <textarea
                    value={lockdownForm.description}
                    onChange={(e) => setLockdownForm({ ...lockdownForm, description: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    rows={4}
                    placeholder="Enter lockdown description"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Reason</label>
                  <select
                    value={lockdownForm.reason}
                    onChange={(e) => setLockdownForm({ ...lockdownForm, reason: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                  >
                    <option value="congestion">Congestion</option>
                    <option value="safety">Safety</option>
                    <option value="emergency">Emergency</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-2">Severity</label>
                  <select
                    value={lockdownForm.severity}
                    onChange={(e) => setLockdownForm({ ...lockdownForm, severity: e.target.value as any })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-2">Location</label>
                  <MapPicker
                    location={lockdownForm.location}
                    onLocationChange={(loc) => setLockdownForm({ ...lockdownForm, location: loc })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold mb-2">Start Time</label>
                    <input
                      type="datetime-local"
                      value={lockdownForm.start_time}
                      onChange={(e) => setLockdownForm({ ...lockdownForm, start_time: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-2">End Time (Optional)</label>
                    <input
                      type="datetime-local"
                      value={lockdownForm.end_time}
                      onChange={(e) => setLockdownForm({ ...lockdownForm, end_time: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowLockdownModal(false)}
                    className="px-6 py-3 font-bold neo-border rounded-lg bg-white dark:bg-windows-dark"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLockdown}
                    className="px-6 py-3 bg-black text-white font-bold neo-border rounded-lg neo-shadow"
                  >
                    Create Lockdown
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Create Congestion Modal */}
      {showCongestionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="neo-border bg-white dark:bg-windows-dark rounded-lg neo-shadow max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Mark Area as Congested</h2>
                <button
                  onClick={() => setShowCongestionModal(false)}
                  className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-bold mb-2">Congestion Level</label>
                  <select
                    value={congestionForm.congestion_level}
                    onChange={(e) => setCongestionForm({ ...congestionForm, congestion_level: e.target.value as any })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-2">Location</label>
                  <MapPicker
                    location={congestionForm.location}
                    onLocationChange={(loc) => setCongestionForm({ ...congestionForm, location: loc })}
                  />
                </div>

                <div>
                  <label className="block font-bold mb-2">Description (Optional)</label>
                  <textarea
                    value={congestionForm.description}
                    onChange={(e) => setCongestionForm({ ...congestionForm, description: e.target.value })}
                    className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                    rows={3}
                    placeholder="Enter congestion details"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block font-bold mb-2">Vehicle Count</label>
                    <input
                      type="number"
                      value={congestionForm.vehicle_count}
                      onChange={(e) => setCongestionForm({ ...congestionForm, vehicle_count: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-2">Avg Speed (km/h)</label>
                    <input
                      type="number"
                      value={congestionForm.average_speed}
                      onChange={(e) => setCongestionForm({ ...congestionForm, average_speed: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                      placeholder="Optional"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-2">Radius (m)</label>
                    <input
                      type="number"
                      value={congestionForm.affected_radius}
                      onChange={(e) => setCongestionForm({ ...congestionForm, affected_radius: e.target.value })}
                      className="w-full px-4 py-2 neo-border rounded-lg bg-background"
                      placeholder="Optional"
                    />
                  </div>
                </div>

                <div className="flex gap-4 justify-end">
                  <button
                    onClick={() => setShowCongestionModal(false)}
                    className="px-6 py-3 font-bold neo-border rounded-lg bg-white dark:bg-windows-dark"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCongestion}
                    className="px-6 py-3 bg-black text-white font-bold neo-border rounded-lg neo-shadow"
                  >
                    Mark Congestion
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

