'use client';

import { motion } from 'framer-motion';
import {
  FileText,
  Users,
  TrendingUp,
  ShieldCheck,
  Megaphone,
  UserCircle,
  Bell,
  Wind,
  Shield,
  Bot,
  Globe
} from 'lucide-react';
import { useOS, AppId } from '@/lib/os-context';
import { useAuth } from '@/lib/auth-context';
import { useState, useEffect } from 'react';

interface AppIcon {
  id: AppId;
  icon: typeof FileText;
  label: string;
  color: string;
}

const apps: AppIcon[] = [
  { id: 'reports', icon: FileText, label: 'Reports', color: 'from-red-500 to-orange-500' },
  { id: 'community', icon: Users, label: 'Community', color: 'from-blue-500 to-cyan-500' },
  { id: 'predictor', icon: TrendingUp, label: 'Predictor', color: 'from-green-500 to-emerald-500' },
  { id: 'security', icon: ShieldCheck, label: 'Security', color: 'from-purple-500 to-pink-500' },
  { id: 'pollution', icon: Wind, label: 'Pollution', color: 'from-cyan-500 to-teal-500' },
  { id: 'admin', icon: Shield, label: 'Admin', color: 'from-red-600 to-red-800' },
  { id: 'alerts', icon: Megaphone, label: 'Alerts', color: 'from-orange-500 to-red-500' },
  { id: 'chat', icon: Bot, label: 'Nagar Mitra', color: 'from-green-500 to-emerald-500' },
  { id: 'monitor', icon: Globe, label: 'City Monitor', color: 'from-indigo-500 to-purple-500' },
  { id: 'profile', icon: UserCircle, label: 'Profile', color: 'from-gray-500 to-gray-700' },
];

export default function Taskbar() {
  const { activeApp, openApp, notifications } = useOS();
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      setDate(now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2 pointer-events-none"
    >
      <div className="glass-effect rounded-2xl px-5 py-3 shadow-2xl pointer-events-auto border-2 border-white/30 backdrop-blur-xl bg-white/70 dark:bg-windows-dark/80"
        style={{
          boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2)',
        }}>
        <div className="flex items-center gap-2">
          {/* App Icons */}
          <div className="flex items-center gap-1">
            {apps.map((app) => {
              const Icon = app.icon;
              const isActive = activeApp === app.id;

              return (
                <motion.button
                  key={app.id}
                  onClick={() => openApp(app.id)}
                  className="relative group"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-300 shadow-lg ${isActive
                      ? `bg-gradient-to-br ${app.color} border-2 border-white/40`
                      : 'bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 border-2 border-transparent'
                      }`}
                  >
                    <Icon
                      className={`w-7 h-7 ${isActive ? 'text-white drop-shadow-lg' : 'text-foreground'}`}
                      strokeWidth={2.5}
                    />
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-gradient-to-r ${app.color}`}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-windows-dark text-white text-xs px-3 py-1.5 rounded-lg whitespace-nowrap">
                      {app.label}
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Divider */}
          <div className="w-px h-10 bg-white/30 dark:bg-white/20 mx-3" />

          {/* System Tray */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <motion.button
              onClick={() => openApp('notifications')}
              className="relative w-14 h-14 rounded-xl flex items-center justify-center bg-white/20 dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 transition-all duration-300 border-2 border-transparent hover:border-white/30 shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
            >
              <Bell className="w-7 h-7 text-foreground" strokeWidth={2.5} />
              {notifications > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
                >
                  {notifications > 9 ? '9+' : notifications}
                </motion.div>
              )}
            </motion.button>

            {/* Clock */}
            <div className="px-4 py-2 text-sm text-foreground bg-white/10 dark:bg-white/5 rounded-xl backdrop-blur-sm border border-white/20">
              <div className="font-bold leading-tight text-base">{time}</div>
              <div className="text-xs opacity-80 leading-tight font-medium">{date}</div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

