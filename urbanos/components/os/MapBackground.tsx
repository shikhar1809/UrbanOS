'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Circle } from 'react-leaflet';
import { motion } from 'framer-motion';
import { ZoomIn, ZoomOut, ChevronRight, Map, Layers } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { AppId, useOS } from '@/lib/os-context';
import { fetchAQIData, getAQILevel } from '@/lib/services/pollution-api';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface ReportMarker {
  id: string;
  position: [number, number];
  title: string;
  type: string;
  description: string;
  status: string;
  created_at: string;
}

interface PollutionMarker {
  id: string;
  position: [number, number];
  aqi: number;
  pm25?: number;
  pm10?: number;
  address: string;
  source: string;
  measured_at: string;
}

// Create custom neo-brutalism marker icons for report types
const createReportTypeIcon = (reportType: string): L.DivIcon => {
  const typeConfig: Record<string, { color: string; icon: string; symbol: string }> = {
    pothole: { color: '#f97316', icon: '🛣️', symbol: '🛣' }, // orange-500
    streetlight: { color: '#eab308', icon: '💡', symbol: '💡' }, // yellow-500
    garbage: { color: '#16a34a', icon: '🗑️', symbol: '🗑' }, // green-600
    cybersecurity: { color: '#a855f7', icon: '🛡️', symbol: '🛡' }, // purple-500
    animal_carcass: { color: '#6b7280', icon: '⚠️', symbol: '⚠' }, // gray-500
    other: { color: '#3b82f6', icon: '📍', symbol: '📍' }, // blue-500
  };

  const config = typeConfig[reportType] || typeConfig.other;

  return L.divIcon({
    className: 'neo-marker-wrapper',
    html: `
      <div style="
        width: 40px;
        height: 40px;
        background: ${config.color};
        border: 4px solid black;
        border-radius: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
        position: relative;
        font-weight: bold;
        font-size: 20px;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        ${config.symbol}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

// Create pollution marker icon with AQI color
const createPollutionIcon = (aqi: number): L.DivIcon => {
  const aqiLevel = getAQILevel(aqi);
  
  return L.divIcon({
    className: 'neo-marker-wrapper',
    html: `
      <div style="
        width: 45px;
        height: 45px;
        background: ${aqiLevel.color};
        border: 4px solid black;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        box-shadow: 6px 6px 0px 0px rgba(0, 0, 0, 1);
        position: relative;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s ease;
      ">
        <div style="font-size: 18px;">🌬️</div>
        <div style="font-size: 10px; color: white; text-shadow: 1px 1px 2px rgba(0,0,0,0.8);">${aqi}</div>
      </div>
    `,
    iconSize: [45, 45],
    iconAnchor: [22, 22],
  });
};

// Component to handle map center and bounds
function MapController({ 
  center, 
  onMapReady 
}: { 
  center: [number, number];
  onMapReady?: (map: L.Map) => void;
}) {
  const map = useMap();

  // Only set the initial view once when the map loads
  useEffect(() => {
    map.setView(center, 13);
    if (onMapReady) {
      onMapReady(map);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // Update center when it changes (for next issue navigation)
  useEffect(() => {
    map.setView(center, map.getZoom(), {
      animate: true,
      duration: 0.5,
    });
  }, [center, map]);

  return null;
}

// Custom Zoom Controls Component with Next Issue button (inside MapContainer)
function ZoomControls({ 
  onNextIssue, 
  hasNextIssue,
  mapMode,
  onMapModeChange
}: { 
  onNextIssue: () => void;
  hasNextIssue: boolean;
  mapMode: 'reports' | 'heatmap';
  onMapModeChange: (mode: 'reports' | 'heatmap') => void;
}) {
  const map = useMap();

  const zoomIn = () => {
    map.zoomIn();
  };

  const zoomOut = () => {
    map.zoomOut();
  };

  return (
    <div className="absolute bottom-32 left-6 z-[1000] flex flex-col gap-2" style={{ pointerEvents: 'auto' }}>
      {/* Map Mode Toggle Buttons */}
      <div className="flex flex-col gap-2">
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMapModeChange('reports');
          }}
          className={`w-12 h-12 border-4 border-black flex items-center justify-center cursor-pointer group ${
            mapMode === 'reports' ? 'bg-blue-500' : 'bg-white'
          }`}
          style={{
            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
            pointerEvents: 'auto',
          }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          title="Reports View"
        >
          <Map className={`w-6 h-6 ${mapMode === 'reports' ? 'text-white' : 'text-black'}`} strokeWidth={3} />
        </motion.button>
        <motion.button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onMapModeChange('heatmap');
          }}
          className={`w-12 h-12 border-4 border-black flex items-center justify-center cursor-pointer group ${
            mapMode === 'heatmap' ? 'bg-orange-500' : 'bg-white'
          }`}
          style={{
            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
            pointerEvents: 'auto',
          }}
          whileHover={{ 
            scale: 1.1,
            boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
          }}
          whileTap={{ scale: 0.95 }}
          transition={{ duration: 0.2 }}
          title="Heatmap View"
        >
          <Layers className={`w-6 h-6 ${mapMode === 'heatmap' ? 'text-white' : 'text-black'}`} strokeWidth={3} />
        </motion.button>
      </div>
      
      {/* Next Issue Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onNextIssue();
        }}
        disabled={!hasNextIssue}
        className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
          pointerEvents: 'auto',
          position: 'relative',
          zIndex: 1001,
        }}
        whileHover={hasNextIssue ? { 
          scale: 1.1,
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        } : {}}
        whileTap={hasNextIssue ? { scale: 0.95 } : {}}
        transition={{ duration: 0.2 }}
        title="Next Issue"
      >
        <ChevronRight className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>

      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          zoomIn();
        }}
        className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center cursor-pointer group"
        style={{
          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
          pointerEvents: 'auto',
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        title="Zoom In"
      >
        <ZoomIn className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>
      
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          zoomOut();
        }}
        className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center cursor-pointer group"
        style={{
          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 0, 1)',
          pointerEvents: 'auto',
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        title="Zoom Out"
      >
        <ZoomOut className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>
    </div>
  );
}

// External controls wrapper (outside MapContainer)
function ExternalControls({ 
  onNextIssue, 
  hasNextIssue,
  onZoomIn,
  onZoomOut
}: { 
  onNextIssue: () => void;
  hasNextIssue: boolean;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) {
  return (
    <div className="absolute bottom-32 left-6 z-[1000] flex flex-col gap-2" style={{ pointerEvents: 'auto' }}>
      {/* Next Issue Button */}
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onNextIssue();
        }}
        disabled={!hasNextIssue}
        className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
          pointerEvents: 'auto',
        }}
        whileHover={hasNextIssue ? { 
          scale: 1.1,
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        } : {}}
        whileTap={hasNextIssue ? { scale: 0.95 } : {}}
        transition={{ duration: 0.2 }}
        title="Next Issue"
      >
        <ChevronRight className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>

      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onZoomIn();
        }}
        className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center cursor-pointer group"
        style={{
          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
          pointerEvents: 'auto',
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        title="Zoom In"
      >
        <ZoomIn className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>
      
      <motion.button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onZoomOut();
        }}
        className="w-12 h-12 bg-white border-4 border-black flex items-center justify-center cursor-pointer group"
        style={{
          boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
          pointerEvents: 'auto',
        }}
        whileHover={{ 
          scale: 1.1,
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.2 }}
        title="Zoom Out"
      >
        <ZoomOut className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>
    </div>
  );
}

type MapMode = 'reports' | 'heatmap';

interface MapBackgroundProps {
  dataView?: 'normal_alerts' | 'cybersecurity_alerts' | 'all_alerts' | 'pollution' | 'all_issues' | 'cybercrime' | 'satisfaction' | 'water_shortage' | 'all';
  activeApp?: AppId | null;
}

export default function MapBackground({ dataView = 'all_alerts', activeApp = null }: MapBackgroundProps) {
  const { setZoomToReportHandler } = useOS();
  const [reportMarkers, setReportMarkers] = useState<ReportMarker[]>([]);
  const [pollutionMarkers, setPollutionMarkers] = useState<PollutionMarker[]>([]);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 }); // Default center position
  const [currentIssueIndex, setCurrentIssueIndex] = useState<number>(-1); // -1 means no report selected
  const [mapMode, setMapMode] = useState<MapMode>('reports');
  const mapRef = useRef<L.Map | null>(null);
  const reportsLoadedRef = useRef<boolean>(false); // Track if reports have been successfully loaded
  const lastDataViewRef = useRef<string | undefined>(dataView); // Track last dataView to prevent unnecessary reloads
  const lastActiveAppRef = useRef<AppId | null | undefined>(activeApp); // Track last activeApp
  const lastMapModeRef = useRef<string>('reports'); // Track last mapMode
  
  // Default center - Lucknow, India
  const defaultCenter: [number, number] = [26.8467, 80.9462]; // Lucknow
  const [mapCenter, setMapCenter] = useState<[number, number]>(defaultCenter);

  // Track mouse movement for moonlight spotlight
  useEffect(() => {
    if (!isDarkMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [isDarkMode]);

  // Listen for theme changes
  useEffect(() => {
    // Check initial theme
    const savedTheme = localStorage.getItem('urbanos-theme') as 'light' | 'dark' | null;
    const initialTheme = savedTheme || 'dark';
    setIsDarkMode(initialTheme === 'dark');

    // Listen for theme changes from settings
    const handleThemeChange = () => {
      const currentTheme = localStorage.getItem('urbanos-theme') as 'light' | 'dark' | null;
      setIsDarkMode(currentTheme === 'dark');
    };

    // Listen for storage changes (when theme is updated in another tab/component)
    window.addEventListener('storage', handleThemeChange);
    
    // Also listen for custom events if theme changes in same tab
    const handleCustomThemeChange = () => {
      const currentTheme = localStorage.getItem('urbanos-theme') as 'light' | 'dark' | null;
      setIsDarkMode(currentTheme === 'dark');
    };
    
    window.addEventListener('urbanos-theme-changed', handleCustomThemeChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleThemeChange);
      window.removeEventListener('urbanos-theme-changed', handleCustomThemeChange as EventListener);
    };
  }, []);


  // Load reports from database - Always load reports unless ONLY viewing pollution (no heatmap)
  useEffect(() => {
    const isPollutionView = dataView === 'pollution' || activeApp === 'pollution';
    const isHeatmapMode = mapMode === 'heatmap';
    const isInitialLoad = lastDataViewRef.current === undefined && lastActiveAppRef.current === undefined;
    
    // Always load reports on initial mount, even if in pollution view (needed for heatmap)
    // Only skip loading if we're already loaded AND viewing pollution AND NOT in heatmap mode
    if (!isInitialLoad && isPollutionView && !isHeatmapMode && reportsLoadedRef.current) {
      if (lastDataViewRef.current !== 'pollution' && lastActiveAppRef.current !== 'pollution') {
        console.log('⚠️ Switching to pollution-only view - clearing report markers');
        setReportMarkers([]);
        reportsLoadedRef.current = false;
      }
      lastDataViewRef.current = dataView;
      lastActiveAppRef.current = activeApp;
      lastMapModeRef.current = String(mapMode || 'reports');
      return;
    }

    // Check if we need to reload
    const dataViewChanged = lastDataViewRef.current !== dataView;
    const activeAppChanged = lastActiveAppRef.current !== activeApp;
    const mapModeChanged = lastMapModeRef.current !== String(mapMode || 'reports');
    
    // Always reload on initial load, view change, or if we have no reports
    const shouldReload = isInitialLoad || 
                        dataViewChanged || 
                        activeAppChanged || 
                        mapModeChanged ||
                        !reportsLoadedRef.current || 
                        reportMarkers.length === 0;
    
    if (!shouldReload) {
      console.log('⏭️ Skipping reload - reports already loaded');
      return;
    }

    console.log('🔄 LOADING REPORTS NOW - dataView:', dataView, 'activeApp:', activeApp, 'mapMode:', mapMode);
    console.log('  Reasons: isInitialLoad=', isInitialLoad, 'dataViewChanged=', dataViewChanged, 'activeAppChanged=', activeAppChanged, 'mapModeChanged=', mapModeChanged, 'noMarkers=', reportMarkers.length === 0);

    const loadReports = async () => {
      try {
        console.log('🔍 Starting report query...');
        
        // Verify Supabase client is initialized
        if (!supabase) {
          console.error('❌ Supabase client is not initialized!');
          return;
        }
        
        let query = supabase
          .from('reports')
          .select('id, title, type, description, status, location, created_at, is_anonymous')
          .order('created_at', { ascending: false });

        // PERMANENT FIX: Apply filters based on view, but default to showing ALL reports
        if (activeApp === 'security' || dataView === 'cybersecurity_alerts') {
          query = query.eq('type', 'cybersecurity');
        } else if (dataView === 'normal_alerts') {
          query = query.neq('type', 'cybersecurity');
        }
        // For 'all_alerts' or any other view, show ALL reports (no filter)

        console.log('🔍 Executing query...');
        const { data, error } = await query.limit(500); // Increased limit for better coverage

        if (error) {
          console.error('❌ Error loading reports:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          console.error('Error code:', error.code, 'Error message:', error.message);
          console.error('Error hint:', error.hint);
          // Check if it's an RLS policy issue
          if (error.code === '42501' || error.message?.includes('policy') || error.message?.includes('permission')) {
            console.error('⚠️ RLS Policy Error: Reports may not be accessible. Check Supabase RLS policies.');
            console.error('⚠️ Run migration: 20240103000001_fix_public_view_all_reports.sql');
          }
          // PERMANENT FIX: Keep existing markers on error - never clear them
          return;
        }

        console.log('📊 Reports loaded from DB:', data?.length || 0, 'reports');
        if (data && data.length > 0) {
          console.log('📋 Sample report:', {
            id: data[0].id,
            title: data[0].title,
            is_anonymous: data[0].is_anonymous,
            has_location: !!data[0].location,
          });
        }
        
        if (!data || data.length === 0) {
          console.warn('⚠️ No reports found. Possible reasons:');
          console.warn('1. RLS policies blocking access (try signing in)');
          console.warn('2. No reports exist in the database');
          console.warn('3. All reports filtered out');
          // PERMANENT FIX: Only clear on first load if we have no data
          if (!reportsLoadedRef.current) {
            setReportMarkers([]);
          }
          return;
        }

        // PERMANENT FIX: More lenient location validation - only exclude truly invalid data
        const reports: ReportMarker[] = (data || [])
          .filter((report: any) => {
            if (!report.location) {
              console.warn('⚠️ Report missing location:', report.id);
              return false;
            }
            if (typeof report.location.lat !== 'number' || typeof report.location.lng !== 'number') {
              console.warn('⚠️ Report has invalid location type:', report.id);
              return false;
            }
            // PERMANENT FIX: Allow 0,0 coordinates if they have an address (might be approximate)
            // Only exclude if truly invalid (NaN, null, undefined)
            if (isNaN(report.location.lat) || isNaN(report.location.lng)) {
              console.warn('⚠️ Report has NaN coordinates:', report.id);
              return false;
            }
            return true;
          })
          .map((report: any) => ({
          id: report.id,
          position: [report.location.lat, report.location.lng] as [number, number],
          title: report.title,
          type: report.type,
            description: report.description || '',
            status: report.status || 'submitted',
            created_at: report.created_at,
        }));

        console.log('✅ Reports after filtering:', reports.length, 'valid reports');
        
        // PERMANENT FIX: Always update markers, even if count is 0 (to clear stale data)
        setReportMarkers(reports);
        reportsLoadedRef.current = true;
        
        // Update refs AFTER successful load
        lastDataViewRef.current = dataView;
        lastActiveAppRef.current = activeApp;
        lastMapModeRef.current = String(mapMode || 'reports');
        
        console.log('✅✅✅ Reports successfully loaded and displayed! Total:', reports.length);
        
        if (reports.length > 0) {
          setCurrentIssueIndex(-1);
        
          // Fit map to show all reports instead of just centering on first one
          setTimeout(() => {
            if (mapRef.current && reports.length > 0) {
              try {
                // Create bounds from all report positions
                const bounds = L.latLngBounds(
                  reports.map(r => r.position as [number, number])
                );
                
                // Fit map to show all markers with some padding
                mapRef.current.fitBounds(bounds, {
                  padding: [50, 50], // Add padding so markers aren't at the edge
                  maxZoom: 15, // Don't zoom in too much
                });
                
                console.log('🗺️ Map fitted to show all', reports.length, 'reports');
              } catch (error) {
                console.error('Error fitting map bounds:', error);
                // Fallback: center on first report
                const firstReport = reports[0];
                mapRef.current.setView(firstReport.position, 13, {
                  animate: true,
                  duration: 0.5,
                });
              }
            }
          }, 1000); // Increased timeout to ensure markers are rendered
        }
      } catch (error) {
        console.error('❌ Exception loading reports:', error);
        // PERMANENT FIX: Never clear markers on error
        reportsLoadedRef.current = false; // Allow retry
      }
    };

    loadReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [String(dataView || 'all'), String(activeApp || 'none'), String(mapMode || 'reports')]); // Ensure stable dependency array - always 3 strings

  // Center map on reports when they load
  useEffect(() => {
    if (reportMarkers.length > 0 && mapRef.current) {
      const firstReport = reportMarkers[0];
      console.log('Centering map on first report:', firstReport.position);
      mapRef.current.setView(firstReport.position, 13, {
        animate: true,
        duration: 0.5,
      });
    }
  }, [reportMarkers]);

  // Load pollution data when pollution view is selected
  useEffect(() => {
    const loadPollutionData = async () => {
      if (dataView !== 'pollution' && activeApp !== 'pollution') {
        setPollutionMarkers([]);
        return;
      }

      try {
        // Fetch from database first
        // Note: Table uses 'timestamp' not 'measured_at', and column names differ
        const { data: dbData, error: dbError } = await supabase
          .from('pollution_data')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(50);

        if (dbError) {
          console.error('Error loading pollution data from DB:', dbError);
          console.error('Error details:', JSON.stringify(dbError, null, 2));
          console.error('Error message:', dbError.message);
          console.error('Error code:', dbError.code);
          console.error('Error hint:', dbError.hint);
          // Continue execution - we'll still try to fetch from API even if DB fails
        }

        const markers: PollutionMarker[] = [];

        // Add database pollution data
        if (dbData && dbData.length > 0) {
          dbData.forEach((item: any) => {
            if (item.location && typeof item.location.lat === 'number' && typeof item.location.lng === 'number') {
              markers.push({
                id: item.id,
                position: [item.location.lat, item.location.lng],
                aqi: item.aqi_value || item.level || 0, // Use aqi_value from table, fallback to level
                pm25: item.pm25_aqi, // Table uses pm25_aqi
                pm10: item.pm10_aqi, // Table uses pm10_aqi
                address: item.location.address || item.location.area_name || 'Unknown',
                source: item.source || 'database',
                measured_at: item.timestamp || item.created_at, // Table uses timestamp
              });
            }
          });
        }

        // Fetch fresh AQI data from API for Lucknow
        const aqiData = await fetchAQIData('lucknow');
        if (aqiData && aqiData.city) {
          markers.push({
            id: `aqi-${Date.now()}`,
            position: [aqiData.city.geo[0], aqiData.city.geo[1]],
            aqi: aqiData.aqi,
            pm25: aqiData.pm25?.v,
            pm10: aqiData.pm10?.v,
            address: aqiData.city.name,
            source: 'api',
            measured_at: aqiData.time?.s || new Date().toISOString(),
          });
        }

        console.log('Pollution markers loaded:', markers.length);
        setPollutionMarkers(markers);

        // Center map on pollution data if available
        if (markers.length > 0 && mapRef.current) {
          const firstMarker = markers[0];
          setTimeout(() => {
            if (mapRef.current) {
              mapRef.current.setView(firstMarker.position, 13, {
                animate: true,
                duration: 0.5,
              });
            }
          }, 500);
        }
      } catch (error) {
        console.error('Error loading pollution data:', error);
      }
    };

    loadPollutionData();
  }, [String(dataView || 'all'), String(activeApp || 'none')]); // Ensure stable dependency array - always strings

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;

    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLat = position.coords.latitude;
          const userLng = position.coords.longitude;
          setMapCenter([userLat, userLng]);
        },
        () => {
          // Use default center if geolocation fails
          console.log('Using default center');
        }
      );
    }

    setIsMapReady(true);
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Find next issue - cycles through reports in order (most recent first)
  const handleNextIssue = () => {
    if (reportMarkers.length === 0) return;

    // If no report is selected, start with the most recent (index 0)
    // Reports are already sorted by created_at descending
    let nextIndex = 0;
    
    if (currentIssueIndex >= 0) {
      // If a report is selected, go to the next one
      nextIndex = (currentIssueIndex + 1) % reportMarkers.length;
    }

    const nextReport = reportMarkers[nextIndex];
    if (nextReport) {
      setMapCenter(nextReport.position);
      setCurrentIssueIndex(nextIndex);
      
      // Animate map to the new position with smooth zoom
      if (mapRef.current) {
        mapRef.current.setView(nextReport.position, 15, {
          animate: true,
          duration: 0.8,
        });
      }
    }
  };

  // Function to zoom to a specific report location (called from ReportsList)
  // Memoize with useCallback to prevent infinite loops
  const zoomToReportLocation = useCallback((lat: number, lng: number) => {
    if (mapRef.current) {
      // Find the report index if it exists
      const reportIndex = reportMarkers.findIndex(
        (marker) => 
          Math.abs(marker.position[0] - lat) < 0.0001 && 
          Math.abs(marker.position[1] - lng) < 0.0001
      );
      
      if (reportIndex >= 0) {
        setCurrentIssueIndex(reportIndex);
      }
      
      // Smoothly zoom to the location
      setMapCenter([lat, lng]);
      mapRef.current.setView([lat, lng], 15, {
        animate: true,
        duration: 0.8,
      });
    }
  }, [reportMarkers]);

  // Register the zoom function with OS context
  useEffect(() => {
    setZoomToReportHandler(zoomToReportLocation);
    return () => {
      setZoomToReportHandler(() => {});
    };
  }, [zoomToReportLocation, setZoomToReportHandler]);

  return (
    <div className="fixed inset-0 z-0" style={{ pointerEvents: 'auto' }}>
      {/* Day/Night transition overlay - lighter so map stays visible */}
      <motion.div
        className="fixed inset-0 z-[1] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ 
          opacity: isDarkMode ? 0.15 : 0,
        }}
        transition={{ 
          duration: 3,
          ease: [0.4, 0, 0.2, 1]
        }}
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.3) 0%, rgba(30, 41, 59, 0.2) 50%, rgba(15, 23, 42, 0.3) 100%)',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Moonlight spotlight effect - follows mouse cursor in dark mode (yellowish-brown) */}
      {isDarkMode && (
        <motion.div
          className="fixed inset-0 z-[1] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 1,
          }}
          transition={{ 
            duration: 3,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            background: `radial-gradient(
              circle 400px at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(255, 235, 180, 0.35) 0%,
              rgba(255, 220, 150, 0.25) 20%,
              rgba(255, 200, 120, 0.15) 40%,
              rgba(255, 180, 100, 0.08) 60%,
              transparent 80%
            )`,
            mixBlendMode: 'screen',
            filter: 'blur(1px)',
            transition: 'background 0.1s ease-out',
          }}
        />
      )}

      {/* Additional moonlight beam for more dramatic effect (yellowish-brown) */}
      {isDarkMode && (
        <motion.div
          className="fixed inset-0 z-[1] pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: 0.7,
          }}
          transition={{ 
            duration: 3,
            ease: [0.4, 0, 0.2, 1]
          }}
          style={{
            background: `radial-gradient(
              ellipse 600px 400px at ${mousePosition.x}% ${mousePosition.y}%, 
              rgba(255, 220, 150, 0.25) 0%,
              rgba(255, 200, 130, 0.15) 30%,
              rgba(255, 180, 110, 0.08) 50%,
              transparent 70%
            )`,
            mixBlendMode: 'screen',
            filter: 'blur(3px)',
            transition: 'background 0.1s ease-out',
          }}
        />
      )}

      {/* Moon animation - moves from left to right when switching to dark mode */}
      <motion.div
        className="fixed z-[2] pointer-events-none"
        initial={{ x: '-150%', y: '20%', opacity: 0 }}
        animate={isDarkMode ? {
          x: '150%',
          y: '20%',
          opacity: [0, 1, 1, 0],
        } : {
          x: '-150%',
          y: '20%',
          opacity: 0,
        }}
        transition={{ 
          duration: 3,
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 3, times: [0, 0.2, 0.8, 1] }
        }}
        style={{
          width: '120px',
          height: '120px',
        }}
      >
        <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-200 to-slate-400 shadow-2xl"
          style={{
            boxShadow: '0 0 60px rgba(255, 255, 255, 0.5), inset -20px -20px 0 rgba(0, 0, 0, 0.2)',
            filter: 'blur(0.5px)',
          }}
        >
          {/* Moon craters */}
          <div className="absolute inset-0 rounded-full"
            style={{
              background: `
                radial-gradient(circle at 30% 30%, rgba(0, 0, 0, 0.1) 8px, transparent 8px),
                radial-gradient(circle at 60% 50%, rgba(0, 0, 0, 0.1) 6px, transparent 6px),
                radial-gradient(circle at 45% 70%, rgba(0, 0, 0, 0.1) 10px, transparent 10px)
              `,
            }}
          />
        </div>
      </motion.div>

      {/* Sun and clouds animation - moves from right to left when switching to light mode */}
      <motion.div
        className="fixed z-[2] pointer-events-none"
        initial={{ x: '150%', y: '15%', opacity: 0 }}
        animate={!isDarkMode ? {
          x: '-150%',
          y: '15%',
          opacity: [0, 1, 1, 0],
        } : {
          x: '150%',
          y: '15%',
          opacity: 0,
        }}
        transition={{ 
          duration: 3,
          ease: [0.4, 0, 0.2, 1],
          opacity: { duration: 3, times: [0, 0.2, 0.8, 1] }
        }}
        style={{
          width: '140px',
          height: '140px',
        }}
      >
        {/* Sun */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400"
          style={{
            boxShadow: '0 0 80px rgba(255, 200, 0, 0.8), 0 0 120px rgba(255, 150, 0, 0.4)',
            filter: 'blur(1px)',
          }}
        />
        
        {/* Clouds */}
        <motion.div
          className="absolute -top-8 -left-12 w-24 h-16 rounded-full bg-white/60"
          style={{
            filter: 'blur(8px)',
            boxShadow: '20px 0 0 -5px rgba(255, 255, 255, 0.5), -10px 10px 0 -5px rgba(255, 255, 255, 0.4)',
          }}
          animate={{
            x: [0, 10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute -bottom-6 -right-8 w-20 h-14 rounded-full bg-white/50"
          style={{
            filter: 'blur(6px)',
            boxShadow: '15px 0 0 -3px rgba(255, 255, 255, 0.4), -8px 8px 0 -3px rgba(255, 255, 255, 0.3)',
          }}
          animate={{
            x: [0, -8, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </motion.div>

      {isMapReady && (
        <MapContainer
          center={mapCenter}
          zoom={13}
          style={{ height: '100%', width: '100%', pointerEvents: 'auto' }}
          zoomControl={false}
          scrollWheelZoom={true}
          doubleClickZoom={true}
          dragging={true}
          touchZoom={true}
          boxZoom={true}
          keyboard={true}
          minZoom={3}
          maxZoom={18}
          className="neo-map"
        >
          {/* OpenStreetMap Tile Layer - switch to dark tiles in dark mode */}
          {isDarkMode ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              className="neo-map-tiles"
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              className="neo-map-tiles"
            />
          )}

          {/* Map Controller - Only sets initial view, doesn't react to marker changes */}
          <MapController 
            center={mapCenter} 
            onMapReady={(map) => {
              mapRef.current = map;
            }}
          />

          {/* Custom Zoom Controls - Inside MapContainer to access map instance */}
          <ZoomControls 
            onNextIssue={handleNextIssue}
            hasNextIssue={reportMarkers.length > 0}
            mapMode={mapMode}
            onMapModeChange={setMapMode}
          />

          {/* Report Markers - Show in reports mode, hide in heatmap mode or pollution-only view */}
          {(() => {
            const isPollutionView = dataView === 'pollution' || activeApp === 'pollution';
            const isHeatmapMode = mapMode === 'heatmap';
            
            console.log('🗺️ Report rendering check:', {
              dataView,
              activeApp,
              isPollutionView,
              isHeatmapMode,
              reportMarkersCount: reportMarkers.length,
            });
            
            // Hide if viewing pollution AND not in heatmap mode
            if (isPollutionView && !isHeatmapMode) {
              console.log('🚫 Hiding report markers - pollution view without heatmap');
              return null;
            }
            
            // Hide individual markers if in heatmap mode (heatmap circles will show instead)
            if (isHeatmapMode) {
              console.log('🚫 Hiding individual report markers - heatmap mode active');
              return null;
            }
            
            // Show reports in all other cases
            if (reportMarkers.length === 0) {
              console.warn('⚠️ No report markers to display (length = 0). Reasons could be:');
              console.warn('  1. No reports in database');
              console.warn('  2. RLS policy blocking access');
              console.warn('  3. Reports filtered out by view settings');
              console.warn('  4. Reports still loading...');
              return null;
            }
            
            console.log('✅ Will attempt to render', reportMarkers.length, 'report markers');
            
            // Filter and render valid markers
            const validMarkers = reportMarkers.filter((report) => {
              if (!report.position || !Array.isArray(report.position) || report.position.length !== 2) {
                return false;
              }
              const [lat, lng] = report.position;
              return typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng);
            });
            
            if (validMarkers.length === 0) {
              return null;
            }
            
            console.log('✅✅✅ RENDERING', validMarkers.length, 'REPORT MARKERS ON MAP');
            console.log('📍 Sample marker position:', validMarkers[0]?.position);
            
            return validMarkers.map((report) => {
              const [lat, lng] = report.position;
              console.log(`📍 Rendering marker ${report.id} at [${lat}, ${lng}]`);
              
              return (
                <Marker 
                  key={report.id} 
                  position={report.position} 
                  icon={createReportTypeIcon(report.type)}
                  eventHandlers={{
                    add: () => {
                      console.log(`✅ Marker ${report.id} added to map`);
                    },
                    remove: () => {
                      console.log(`❌ Marker ${report.id} removed from map`);
                    }
                  }}
                >
                <Popup className="neo-popup">
                    <div className="neo-popup-content" style={{ minWidth: '200px', maxWidth: '300px' }}>
                      <div className="font-bold mb-2 text-black text-sm">{report.title}</div>
                      <div className="text-xs text-black/70 mb-2">
                        <span className="font-semibold">Type:</span> {report.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      <div className="text-xs text-black/70 mb-2">
                        <span className="font-semibold">Status:</span> {report.status.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </div>
                      {report.description && (
                        <div className="text-xs text-black/60 mb-2 line-clamp-2">
                          {report.description}
                        </div>
                      )}
                      <div className="text-xs text-black/50">
                        {new Date(report.created_at).toLocaleString()}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ));
          })()}

          {/* Pollution Markers - Show when pollution view is selected, hide in heatmap mode */}
          {(dataView === 'pollution' || activeApp === 'pollution') && mapMode !== 'heatmap' && pollutionMarkers.map((pollution) => {
            const aqiLevel = getAQILevel(pollution.aqi);
            return (
              <Marker 
                key={pollution.id} 
                position={pollution.position} 
                icon={createPollutionIcon(pollution.aqi)}
              >
                <Popup className="neo-popup">
                  <div className="neo-popup-content" style={{ minWidth: '200px', maxWidth: '300px' }}>
                    <div className="font-bold mb-2 text-black text-sm" style={{ color: aqiLevel.color }}>
                      AQI: {pollution.aqi} - {aqiLevel.level}
                    </div>
                    <div className="text-xs text-black/70 mb-2">
                      <span className="font-semibold">Location:</span> {pollution.address}
                    </div>
                    {pollution.pm25 && (
                      <div className="text-xs text-black/70 mb-2">
                        <span className="font-semibold">PM2.5:</span> {pollution.pm25} µg/m³
                      </div>
                    )}
                    {pollution.pm10 && (
                      <div className="text-xs text-black/70 mb-2">
                        <span className="font-semibold">PM10:</span> {pollution.pm10} µg/m³
                      </div>
                    )}
                    <div className="text-xs text-black/70 mb-2">
                      <span className="font-semibold">Source:</span> {pollution.source === 'api' ? 'AQI API' : 'User Report'}
                    </div>
                    <div className="text-xs text-black/50">
                      {new Date(pollution.measured_at).toLocaleString()}
                    </div>
                    <div className="text-xs text-black/60 mt-2 italic">
                      {aqiLevel.description}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Heatmap Circles - Show in heatmap mode, works with any dataView including pollution */}
          {mapMode === 'heatmap' && (() => {
            const isPollutionView = dataView === 'pollution' || activeApp === 'pollution';
            
            // Calculate distance between two points in meters
            const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
              const R = 6371e3; // Earth's radius in meters
              const φ1 = lat1 * Math.PI / 180;
              const φ2 = lat2 * Math.PI / 180;
              const Δφ = (lat2 - lat1) * Math.PI / 180;
              const Δλ = (lng2 - lng1) * Math.PI / 180;

              const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                        Math.cos(φ1) * Math.cos(φ2) *
                        Math.sin(Δλ/2) * Math.sin(Δλ/2);
              const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

              return R * c;
            };

            // POLLUTION HEATMAP: Cluster pollution markers by AQI levels
            if (isPollutionView) {
              const clusterDistance = 2000; // 2km for pollution (larger areas)
              const clusters: Array<{
                center: [number, number];
                markers: PollutionMarker[];
                avgAQI: number;
                density: number;
                maxAQI: number;
              }> = [];

              if (pollutionMarkers.length === 0) {
                console.log('⚠️ No pollution markers available for heatmap');
                return null;
              }

              pollutionMarkers.forEach((marker) => {
                if (!marker.position || !Array.isArray(marker.position) || marker.position.length !== 2) {
                  return;
                }
                
                const [lat, lng] = marker.position;
                if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
                  return;
                }

                let assigned = false;
                
                for (const cluster of clusters) {
                  const distance = calculateDistance(
                    cluster.center[0],
                    cluster.center[1],
                    lat,
                    lng
                  );
                  
                  if (distance <= clusterDistance) {
                    cluster.markers.push(marker);
                    const avgLat = cluster.markers.reduce((sum, m) => sum + m.position[0], 0) / cluster.markers.length;
                    const avgLng = cluster.markers.reduce((sum, m) => sum + m.position[1], 0) / cluster.markers.length;
                    cluster.center = [avgLat, avgLng];
                    cluster.density = cluster.markers.length;
                    cluster.avgAQI = Math.round(cluster.markers.reduce((sum, m) => sum + m.aqi, 0) / cluster.markers.length);
                    cluster.maxAQI = Math.max(...cluster.markers.map(m => m.aqi));
                    
                    assigned = true;
                    break;
                  }
                }
                
                if (!assigned) {
                  clusters.push({
                    center: marker.position,
                    markers: [marker],
                    density: 1,
                    avgAQI: marker.aqi,
                    maxAQI: marker.aqi,
                  });
                }
              });

              if (clusters.length === 0) {
                return null;
              }

              console.log('✅ Rendering pollution heatmap with', clusters.length, 'clusters');

              // Render pollution heatmap circles colored by AQI level
              return clusters.map((cluster, index) => {
                const aqiLevel = getAQILevel(cluster.maxAQI);
                
                // Calculate opacity based on AQI severity (higher AQI = more opaque)
                let opacity = 0.3;
                if (cluster.maxAQI <= 50) {
                  opacity = 0.2; // Good - light
                } else if (cluster.maxAQI <= 100) {
                  opacity = 0.4; // Moderate
                } else if (cluster.maxAQI <= 150) {
                  opacity = 0.6; // Unhealthy for sensitive
                } else if (cluster.maxAQI <= 200) {
                  opacity = 0.75; // Unhealthy
                } else if (cluster.maxAQI <= 300) {
                  opacity = 0.85; // Very unhealthy
                } else {
                  opacity = 0.95; // Hazardous
                }
                
                // Calculate radius based on density and AQI
                const baseRadius = 500;
                const densityMultiplier = Math.min(cluster.density, 5); // Cap at 5x
                const radius = baseRadius + (densityMultiplier * 300);
                
                return (
                  <Circle
                    key={`pollution-heat-${index}`}
                    center={cluster.center}
                    radius={radius}
                    pathOptions={{
                      color: aqiLevel.color,
                      fillColor: aqiLevel.color,
                      fillOpacity: opacity,
                      weight: 3,
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold mb-1 text-sm" style={{ color: aqiLevel.color }}>
                          Air Quality Zone - {aqiLevel.level}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Max AQI:</strong> {cluster.maxAQI}
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Avg AQI:</strong> {cluster.avgAQI}
                        </p>
                        <p className="text-xs text-gray-500 mb-2 italic">
                          {aqiLevel.description}
                        </p>
                        <p className="text-xs text-gray-600">
                          {cluster.density} {cluster.density === 1 ? 'reading' : 'readings'} in this area
                        </p>
                      </div>
                    </Popup>
                  </Circle>
                );
              });
            }

            // REPORTS HEATMAP: Cluster reports by proximity
            const clusterDistance = 1000; // 1km clustering distance
            const clusters: Array<{
              center: [number, number];
              reports: ReportMarker[];
              density: number;
              dominantType: string;
            }> = [];

            // Only process if we have reports
            if (reportMarkers.length === 0) {
              console.log('⚠️ No reports available for heatmap');
              return null;
            }

            reportMarkers.forEach((report) => {
              // Validate report position before clustering
              if (!report.position || !Array.isArray(report.position) || report.position.length !== 2) {
                return; // Skip invalid reports
              }
              
              const [lat, lng] = report.position;
              if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
                return; // Skip invalid coordinates
              }

              let assigned = false;
              
              // Try to assign to existing cluster
              for (const cluster of clusters) {
                const distance = calculateDistance(
                  cluster.center[0],
                  cluster.center[1],
                  lat,
                  lng
                );
                
                if (distance <= clusterDistance) {
                  cluster.reports.push(report);
                  // Recalculate cluster center (average position)
                  const avgLat = cluster.reports.reduce((sum, r) => sum + r.position[0], 0) / cluster.reports.length;
                  const avgLng = cluster.reports.reduce((sum, r) => sum + r.position[1], 0) / cluster.reports.length;
                  cluster.center = [avgLat, avgLng];
                  cluster.density = cluster.reports.length;
                  
                  // Find dominant type in cluster
                  const typeCounts: Record<string, number> = {};
                  cluster.reports.forEach(r => {
                    typeCounts[r.type] = (typeCounts[r.type] || 0) + 1;
                  });
                  cluster.dominantType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';
                  
                  assigned = true;
                  break;
                }
              }
              
              // Create new cluster if not assigned
              if (!assigned) {
                clusters.push({
                  center: report.position,
                  reports: [report],
                  density: 1,
                  dominantType: report.type,
                });
              }
            });

            // If no clusters created, return null
            if (clusters.length === 0) {
              console.log('⚠️ No clusters created for heatmap');
              return null;
            }

            console.log('✅ Rendering reports heatmap with', clusters.length, 'clusters');

            // Get heat color based on type and density
            const getHeatColor = (type: string, density: number): string => {
              const baseColors: Record<string, string> = {
                pothole: '#f97316',      // Orange
                streetlight: '#eab308',  // Yellow
                garbage: '#16a34a',       // Green
                cybersecurity: '#a855f7', // Purple
                animal_carcass: '#6b7280', // Gray
                other: '#3b82f6',        // Blue
              };
              
              const baseColor = baseColors[type] || '#3b82f6';
              
              // Increase intensity (darker/more saturated) based on density
              // Density 1-2: light (0.3 opacity)
              // Density 3-5: medium (0.5 opacity)
              // Density 6-10: high (0.7 opacity)
              // Density 10+: very high (0.9 opacity)
              
              return baseColor;
            };

            // Get opacity and radius based on density
            const getDensityStyle = (density: number) => {
              if (density === 1) {
                return { opacity: 0.25, radius: 400, weight: 1 };
              } else if (density === 2) {
                return { opacity: 0.35, radius: 500, weight: 2 };
              } else if (density >= 3 && density <= 5) {
                return { opacity: 0.5, radius: 600, weight: 3 };
              } else if (density >= 6 && density <= 10) {
                return { opacity: 0.7, radius: 800, weight: 4 };
              } else {
                return { opacity: 0.9, radius: 1000, weight: 5 };
              }
            };

            return clusters.map((cluster, index) => {
              const style = getDensityStyle(cluster.density);
              const color = getHeatColor(cluster.dominantType, cluster.density);
              
              return (
                <Circle
                  key={`heat-cluster-${index}`}
                  center={cluster.center}
                  radius={style.radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: style.opacity,
                    weight: style.weight,
                  }}
                >
                  <Popup>
                    <div className="p-2">
                      <h4 className="font-semibold mb-1 text-sm">
                        {cluster.density === 1 
                          ? cluster.reports[0].title 
                          : `${cluster.density} Issues in This Area`}
                      </h4>
                      <p className="text-xs text-gray-600 capitalize mb-1">
                        {cluster.dominantType.replace('_', ' ')} {cluster.density > 1 ? `(${cluster.density} reports)` : ''}
                      </p>
                      {cluster.density > 1 && (
                        <div className="mt-2 text-xs">
                          <p className="font-semibold mb-1">Report Types:</p>
                          <ul className="list-disc list-inside space-y-0.5">
                            {Object.entries(
                              cluster.reports.reduce((acc, r) => {
                                acc[r.type] = (acc[r.type] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).map(([type, count]) => (
                              <li key={type} className="capitalize">
                                {type.replace('_', ' ')}: {count}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </Popup>
                </Circle>
              );
            });
          })()}
        </MapContainer>
      )}

      {/* Map Legend with Neo-Brutalism Styling */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.5, type: 'spring', stiffness: 200 }}
        className="absolute bottom-32 right-6 z-50 bg-white border-4 border-black p-5 text-black space-y-2 max-h-[400px] overflow-y-auto"
        style={{
          boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
        }}
      >
        <div className="font-bold mb-3 text-lg border-b-2 border-black pb-2">
          {activeApp === 'security' ? 'Security Incidents' : 'Report Types'}
        </div>
        {activeApp === 'security' ? (
        <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-purple-500 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
              🛡
          </div>
            <span className="font-semibold text-sm">Cybersecurity</span>
        </div>
        ) : (
          <>
        <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-orange-500 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
                🛣
          </div>
              <span className="font-semibold text-sm">Pothole</span>
        </div>
        <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-yellow-500 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
                💡
          </div>
              <span className="font-semibold text-sm">Streetlight</span>
        </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-green-600 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
                🗑
              </div>
              <span className="font-semibold text-sm">Garbage</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-purple-500 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
                🛡
              </div>
              <span className="font-semibold text-sm">Cybersecurity</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-500 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
                ⚠
              </div>
              <span className="font-semibold text-sm">Animal Carcass</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-blue-500 border-4 border-black flex items-center justify-center text-lg" style={{ boxShadow: '3px 3px 0px 0px rgba(0, 0, 0, 1)' }}>
                📍
              </div>
              <span className="font-semibold text-sm">Other</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}

