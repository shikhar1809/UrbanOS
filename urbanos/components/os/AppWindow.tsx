'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Minus, Square } from 'lucide-react';
import { useOS, AppId } from '@/lib/os-context';
import { ReactNode, useState } from 'react';

interface AppWindowProps {
  appId: AppId;
  title: string;
  icon: ReactNode;
  children: ReactNode;
}

export default function AppWindow({ appId, title, icon, children }: AppWindowProps) {
  const { activeApp, closeApp, minimizeApp } = useOS();
  const [isMaximized, setIsMaximized] = useState(false);
  const isOpen = activeApp === appId;

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
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
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            onClick={closeApp}
          />

          {/* App Window */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              width: isMaximized ? '100vw' : '90vw',
              height: isMaximized ? '100vh' : '85vh',
              maxWidth: isMaximized ? '100%' : '1200px',
              maxHeight: isMaximized ? '100%' : '800px',
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className={`fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white/95 dark:bg-windows-dark/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col border border-black/20 rounded-2xl ${
              isMaximized ? 'rounded-none' : ''
            }`}
            style={{
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Window Header with Mac-style Controls */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 bg-gradient-to-r from-white/80 via-white/60 to-white/80 dark:from-windows-dark/80 dark:via-windows-dark/60 dark:to-windows-dark/80 backdrop-blur-xl">
              {/* Mac-style Traffic Lights */}
              <div className="flex items-center gap-2 ml-3">
                {/* Close (Red) */}
                <motion.button
                  onClick={closeApp}
                  className="w-3 h-3 rounded-full bg-[#FF5F56] flex items-center justify-center group relative border border-[#E0443E] shadow-sm"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title="Close"
                >
                  <X 
                    className="w-2 h-2 text-[#8B0000] opacity-0 group-hover:opacity-100 transition-opacity" 
                    strokeWidth={3}
                  />
                </motion.button>

                {/* Minimize (Yellow) */}
                <motion.button
                  onClick={minimizeApp}
                  className="w-3 h-3 rounded-full bg-[#FFBD2E] flex items-center justify-center group relative border border-[#DEA123] shadow-sm"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title="Minimize"
                >
                  <Minus 
                    className="w-2 h-2 text-[#8B5A00] opacity-0 group-hover:opacity-100 transition-opacity" 
                    strokeWidth={3}
                  />
                </motion.button>

                {/* Maximize/Side-by-side (Green) */}
                <motion.button
                  onClick={handleMaximize}
                  className="w-3 h-3 rounded-full bg-[#27C93F] flex items-center justify-center group relative border border-[#1AAB29] shadow-sm"
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  title={isMaximized ? "Restore" : "Maximize"}
                >
                  <Square 
                    className={`w-1.5 h-1.5 text-[#006400] opacity-0 group-hover:opacity-100 transition-opacity ${isMaximized ? 'rotate-180' : ''}`}
                    strokeWidth={2.5}
                  />
                </motion.button>
              </div>

              {/* Title and Icon */}
              <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
                {icon}
                <h2 className="text-base font-semibold text-foreground">{title}</h2>
              </div>

              {/* Spacer for symmetry */}
              <div className="w-20" />
            </div>

            {/* Window Content */}
            <div className="flex-1 overflow-y-auto bg-white/50 dark:bg-windows-dark/30 backdrop-blur-sm">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

