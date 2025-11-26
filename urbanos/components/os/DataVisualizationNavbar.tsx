'use client';

import { AlertTriangle, Shield, TrendingUp, Droplet, Wind } from 'lucide-react';
import MacOSDock from '@/components/ui/mac-os-dock';
import { motion } from 'framer-motion';

export type DataViewType = 'normal_alerts' | 'cybersecurity_alerts' | 'all_alerts' | 'pollution';

interface DataVisualizationNavbarProps {
  onViewChange: (view: DataViewType) => void;
  currentView: DataViewType;
}

const dataViews = [
  { 
    id: 'normal_alerts' as DataViewType, 
    name: 'Normal Alerts', 
    icon: <AlertTriangle className="w-full h-full text-red-600" strokeWidth={3} fill="currentColor" />
  },
  { 
    id: 'cybersecurity_alerts' as DataViewType, 
    name: 'Cybersecurity Alerts', 
    icon: <Shield className="w-full h-full text-purple-600" strokeWidth={3} fill="currentColor" />
  },
  { 
    id: 'all_alerts' as DataViewType, 
    name: 'All Alerts', 
    icon: <AlertTriangle className="w-full h-full text-blue-600" strokeWidth={3} fill="currentColor" />
  },
  { 
    id: 'pollution' as DataViewType, 
    name: 'Pollution', 
    icon: <Wind className="w-full h-full text-cyan-600" strokeWidth={3} fill="currentColor" />
  },
];

export default function DataVisualizationNavbar({ onViewChange, currentView }: DataVisualizationNavbarProps) {
  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
      style={{
        filter: 'drop-shadow(0px 4px 12px rgba(0, 0, 0, 0.3)) drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.2))',
      }}
    >
      <div className="pointer-events-auto">
        <MacOSDock
          apps={dataViews}
          onAppClick={(appId) => onViewChange(appId as DataViewType)}
          openApps={[currentView]}
          className=""
        />
      </div>
    </motion.div>
  );
}

