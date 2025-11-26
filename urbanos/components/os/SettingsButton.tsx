'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings } from 'lucide-react';
import SettingsPanel from './SettingsPanel';

export default function SettingsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('12h');

  useEffect(() => {
    // Load time format from localStorage
    const savedTimeFormat = localStorage.getItem('urbanos-time-format') as '12h' | '24h' | null;
    if (savedTimeFormat) setTimeFormat(savedTimeFormat);

    const updateTime = () => {
      const now = new Date();
      
      // Format time based on preference
      let timeString: string;
      if (timeFormat === '24h') {
        timeString = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false
        });
      } else {
        timeString = now.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true
        });
      }
      
      setTime(timeString);
      setDate(now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [timeFormat]);

  // Listen for time format changes from settings panel
  useEffect(() => {
    const handleTimeFormatChange = (e: CustomEvent) => {
      setTimeFormat(e.detail);
    };

    window.addEventListener('urbanos-time-format-changed', handleTimeFormatChange as EventListener);

    return () => {
      window.removeEventListener('urbanos-time-format-changed', handleTimeFormatChange as EventListener);
    };
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: 20, y: 20 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-30"
      >
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="group flex items-center gap-4 px-5 py-3 bg-black/70 backdrop-blur-xl border-2 border-white/30 rounded-2xl hover:bg-black/80 hover:border-white/50 transition-all duration-300 shadow-2xl hover:shadow-white/20"
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Time and Date Display */}
          <div className="text-right text-white">
            <div className="text-lg font-bold leading-tight">{time}</div>
            <div className="text-xs font-medium opacity-90 leading-tight">{date}</div>
          </div>
          
          {/* Settings Icon */}
          <motion.div
            className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg border-2 border-white/30"
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <Settings className="w-6 h-6 text-white" strokeWidth={2.5} />
          </motion.div>
        </motion.button>
      </motion.div>

      {/* Settings Panel */}
      <SettingsPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}

