'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SplashScreen from './SplashScreen';

interface OSLoaderProps {
  children: React.ReactNode;
}

export default function OSLoader({ children }: OSLoaderProps) {
  const [showSplash, setShowSplash] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if splash should be shown
    const splashShown = sessionStorage.getItem('openos-splash-shown');
    if (splashShown === 'true') {
      // Already shown in this session, skip it
      setShowSplash(false);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('openos-splash-shown', 'true');
    setIsTransitioning(true);
    // Wait a bit for splash fade-out before showing OS page
    setTimeout(() => {
      setShowSplash(false);
      setIsTransitioning(false);
    }, 500); // Match splash fade-out duration (0.5s)
  };

  // Wait for client-side hydration
  if (!isClient) {
    return <div className="fixed inset-0 bg-black z-[9999]" />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen onComplete={handleSplashComplete} key="splash" />
        )}
        {!showSplash && !isTransitioning && (
          <motion.div
            key="os"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Black overlay during transition */}
      {isTransitioning && (
        <div className="fixed inset-0 bg-black z-[9998]" />
      )}
    </>
  );
}

