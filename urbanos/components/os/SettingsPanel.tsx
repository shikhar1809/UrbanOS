'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Moon, Sun, Bell, Volume2, VolumeX, Globe, X } from 'lucide-react';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [notifications, setNotifications] = useState(true);
  const [sounds, setSounds] = useState(true);
  const [language, setLanguage] = useState('en');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');

  useEffect(() => {
    // Load settings from localStorage
    const savedTheme = localStorage.getItem('urbanos-theme') as 'light' | 'dark' | null;
    const savedNotifications = localStorage.getItem('urbanos-notifications');
    const savedSounds = localStorage.getItem('urbanos-sounds');
    const savedTimeFormat = localStorage.getItem('urbanos-time-format') as '12h' | '24h' | null;
    
    if (savedTheme) setTheme(savedTheme);
    if (savedNotifications !== null) setNotifications(savedNotifications === 'true');
    if (savedSounds !== null) setSounds(savedSounds === 'true');
    if (savedTimeFormat) setTimeFormat(savedTimeFormat);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    localStorage.setItem('urbanos-theme', newTheme);
    // Apply theme to document
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Dispatch custom event to notify map component
    window.dispatchEvent(new CustomEvent('urbanos-theme-changed', { detail: newTheme }));
  };

  const handleNotificationsChange = (value: boolean) => {
    setNotifications(value);
    localStorage.setItem('urbanos-notifications', value.toString());
  };

  const handleSoundsChange = (value: boolean) => {
    setSounds(value);
    localStorage.setItem('urbanos-sounds', value.toString());
  };

  const handleTimeFormatChange = (format: '12h' | '24h') => {
    setTimeFormat(format);
    localStorage.setItem('urbanos-time-format', format);
    // Dispatch custom event to notify SettingsButton
    window.dispatchEvent(new CustomEvent('urbanos-time-format-changed', { detail: format }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          />

          {/* Settings Panel */}
          <motion.div
            initial={{ opacity: 0, y: 100, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: 100, x: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white/95 dark:bg-windows-dark/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/20 overflow-hidden"
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-black/10 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-windows-dark/80 dark:via-windows-dark/60 dark:to-windows-dark/80 backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-foreground" />
                <h2 className="text-lg font-semibold text-foreground">Settings</h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4 text-foreground" />
              </button>
            </div>

            {/* Settings Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Theme Selection */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  Theme
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleThemeChange('light')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      theme === 'light'
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white/10 border-black/20 text-foreground hover:bg-white/20'
                    }`}
                  >
                    <Sun className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Light</span>
                  </button>
                  <button
                    onClick={() => handleThemeChange('dark')}
                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all ${
                      theme === 'dark'
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white/10 border-black/20 text-foreground hover:bg-white/20'
                    }`}
                  >
                    <Moon className="w-5 h-5 mx-auto mb-1" />
                    <span className="text-sm font-medium">Dark</span>
                  </button>
                </div>
              </div>

              {/* Notifications */}
              <div>
                <label className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 rounded-xl cursor-pointer hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-foreground" />
                    <div>
                      <span className="block text-sm font-semibold text-foreground">Notifications</span>
                      <span className="block text-xs text-foreground/70">Enable system notifications</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications}
                    onChange={(e) => handleNotificationsChange(e.target.checked)}
                    className="w-5 h-5 rounded accent-blue-500"
                  />
                </label>
              </div>

              {/* Sounds */}
              <div>
                <label className="flex items-center justify-between p-4 bg-white/10 dark:bg-white/5 rounded-xl cursor-pointer hover:bg-white/20 dark:hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-3">
                    {sounds ? (
                      <Volume2 className="w-5 h-5 text-foreground" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-foreground" />
                    )}
                    <div>
                      <span className="block text-sm font-semibold text-foreground">Sounds</span>
                      <span className="block text-xs text-foreground/70">Enable system sounds</span>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={sounds}
                    onChange={(e) => handleSoundsChange(e.target.checked)}
                    className="w-5 h-5 rounded accent-blue-500"
                  />
                </label>
              </div>

              {/* Time Format */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3">Time Format</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleTimeFormatChange('12h')}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all ${
                      timeFormat === '12h'
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white/10 border-black/20 text-foreground hover:bg-white/20'
                    }`}
                  >
                    12 Hour
                  </button>
                  <button
                    onClick={() => handleTimeFormatChange('24h')}
                    className={`flex-1 py-2 px-4 rounded-xl border-2 transition-all ${
                      timeFormat === '24h'
                        ? 'bg-blue-500 border-blue-600 text-white'
                        : 'bg-white/10 border-black/20 text-foreground hover:bg-white/20'
                    }`}
                  >
                    24 Hour
                  </button>
                </div>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full py-2 px-4 bg-white/10 dark:bg-white/5 border-2 border-black/20 rounded-xl text-foreground focus:outline-none focus:border-blue-500"
                >
                  <option value="en">English</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                </select>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

