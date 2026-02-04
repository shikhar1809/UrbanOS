'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Home, ArrowLeft, AlertTriangle, Users, Map, Shield, User, Bell, Siren, Wind, ShieldCheck, Bot } from 'lucide-react';
import dynamic from 'next/dynamic';
import SettingsButton from './SettingsButton';
import WeatherDisplay from './WeatherDisplay';
import DataVisualizationNavbar, { DataViewType } from './DataVisualizationNavbar';
import { useOS, AppId } from '@/lib/os-context';
import { useState } from 'react';

// Dynamically import MapBackground to avoid SSR issues with Leaflet
const MapBackground = dynamic(() => import('./MapBackground'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 z-0 bg-slate-950" />,
});

interface DesktopIcon {
  id: AppId;
  icon: typeof AlertTriangle;
  label: string;
  color: string;
  position: { x: number; y: number };
}

const desktopIcons: DesktopIcon[] = [
  { id: 'reports', icon: AlertTriangle, label: 'Reports', color: 'from-red-500 to-orange-500', position: { x: 8, y: 15 } },
  { id: 'notifications', icon: Bell, label: 'Notifications', color: 'from-yellow-500 to-amber-500', position: { x: 14, y: 15 } },
  { id: 'community', icon: Users, label: 'Community', color: 'from-blue-500 to-cyan-500', position: { x: 8, y: 30 } },
  { id: 'predictor', icon: Map, label: 'Predictor', color: 'from-green-500 to-emerald-500', position: { x: 8, y: 45 } },
  { id: 'security', icon: Shield, label: 'Security', color: 'from-purple-500 to-pink-500', position: { x: 8, y: 60 } },
  { id: 'alerts', icon: Siren, label: 'Alerts', color: 'from-orange-500 to-red-500', position: { x: 14, y: 30 } },
  { id: 'pollution', icon: Wind, label: 'Pollution', color: 'from-cyan-500 to-teal-500', position: { x: 14, y: 45 } },
  { id: 'admin', icon: ShieldCheck, label: 'Admin', color: 'from-red-600 to-red-800', position: { x: 14, y: 60 } },
  { id: 'chat', icon: Bot, label: 'Nagar Mitra', color: 'from-green-500 to-emerald-500', position: { x: 8, y: 75 } },
  { id: 'profile', icon: User, label: 'Profile', color: 'from-gray-500 to-gray-700', position: { x: 14, y: 75 } },
];

export default function Desktop() {
  const { openApp, activeApp } = useOS();
  const [selectedIcon, setSelectedIcon] = useState<AppId | null>(null);
  const [dataView, setDataView] = useState<DataViewType>('all_alerts');

  return (
    <>
      {/* Map Background with Issue Markers */}
      <MapBackground dataView={dataView} activeApp={activeApp} />

      {/* Data Visualization Navbar */}
      <DataVisualizationNavbar
        currentView={dataView}
        onViewChange={setDataView}
      />

      {/* Return to Home Button - Neo-Brutalism */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="absolute top-6 left-6 z-20"
      >
        <Link
          href="/"
          className="group flex items-center gap-3 px-6 py-3 bg-white border-4 border-black rounded-none hover:bg-yellow-200 transition-all duration-200"
          style={{
            boxShadow: '6px 6px 0px 0px rgba(0, 0, 0, 1)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '8px 8px 0px 0px rgba(0, 0, 0, 1)';
            e.currentTarget.style.transform = 'translate(-2px, -2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '6px 6px 0px 0px rgba(0, 0, 0, 1)';
            e.currentTarget.style.transform = 'translate(0, 0)';
          }}
        >
          <ArrowLeft className="w-5 h-5 text-black group-hover:-translate-x-1 transition-transform duration-300" strokeWidth={3} />
          <span className="text-black font-bold text-sm">Return to Home</span>
          <Home className="w-5 h-5 text-black/80" strokeWidth={3} />
        </Link>
      </motion.div>

      {/* Desktop Icons */}
      <div className="absolute inset-0 z-10 pointer-events-none" style={{ touchAction: 'none' }}>
        {desktopIcons.map((icon, index) => {
          const IconComponent = icon.icon;
          const isSelected = selectedIcon === icon.id;

          return (
            <motion.button
              key={icon.id}
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.7 + index * 0.1, duration: 0.5, type: "spring", stiffness: 200 }}
              onClick={() => {
                setSelectedIcon(icon.id);
                openApp(icon.id);
              }}
              onDoubleClick={() => openApp(icon.id)}
              className="absolute pointer-events-auto group"
              style={{
                left: `${icon.position.x}%`,
                top: `${icon.position.y}%`,
              }}
              whileHover={{ scale: 1.1, y: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Icon Container - Neo-Brutalism */}
              <div className="flex flex-col items-center gap-2 p-2">
                {/* Icon */}
                <motion.div
                  className={`w-16 h-16 rounded-none flex items-center justify-center border-4 border-black bg-gradient-to-br ${isSelected ? icon.color : icon.color
                    }`}
                  style={{
                    boxShadow: isSelected ? '8px 8px 0px 0px rgba(0, 0, 0, 1)' : '6px 6px 0px 0px rgba(0, 0, 0, 1)',
                  }}
                  whileHover={{
                    rotate: 5,
                    scale: 1.05,
                    boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 1)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <IconComponent className="w-8 h-8 text-white" strokeWidth={3} />
                </motion.div>

                {/* Label */}
                <motion.span
                  className="text-black text-xs font-bold px-2 py-1 rounded-none bg-white border-2 border-black text-center max-w-[80px] truncate"
                  style={{
                    boxShadow: isSelected ? '4px 4px 0px 0px rgba(0, 0, 0, 1)' : '3px 3px 0px 0px rgba(0, 0, 0, 1)',
                  }}
                >
                  {icon.label}
                </motion.span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* UrbanOS Logo - Top Right with Shadow - Show when no app is open */}
      {!activeApp && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="fixed top-6 right-6 z-20 pointer-events-none flex flex-col items-end gap-6"
          style={{
            filter: 'drop-shadow(0 6px 20px rgba(0, 0, 0, 0.4)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.3)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2))',
          }}
        >
          <div className="relative w-[140px] h-[100px] md:w-[160px] md:h-[115px]">
            <Image
              src="/logo.png"
              alt="UrbanOS Logo"
              fill
              sizes="(max-width: 768px) 140px, 160px"
              className="object-contain"
              priority
            />
          </div>

          {/* Weather Display below logo - Big and Prominent (no background, just shadow) */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="px-6 py-5 min-w-[180px]"
          >
            <WeatherDisplay />
          </motion.div>
        </motion.div>
      )}

      {/* Settings Button with Time/Date - Bottom Right */}
      <SettingsButton />
    </>
  );
}

