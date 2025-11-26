'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { Check, Loader2 } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

const loadingMessages = [
  { text: 'Checking connection...', icon: Loader2, completed: false },
  { text: 'Loading issues...', icon: Loader2, completed: false },
  { text: 'Making personalized feed...', icon: Loader2, completed: false },
  { text: 'Initializing services...', icon: Loader2, completed: false },
  { text: 'Preparing dashboard...', icon: Loader2, completed: false },
  { text: 'Loading community data...', icon: Loader2, completed: false },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [videoOpacity, setVideoOpacity] = useState(1);
  const [currentMessages, setCurrentMessages] = useState<typeof loadingMessages>([]);
  const videoRef = useRef<HTMLVideoElement>(null);

  const totalDuration = 7000; // 7 seconds total
  const fadeStartTime = 6500; // Start fading at 6.5 seconds

  useEffect(() => {
    // Auto-play background video
    const video = videoRef.current;
            if (video) {
              video.play().catch(() => {
                // Autoplay prevented - browser policy, no action needed
              });
            }
  }, []);

  useEffect(() => {
    // Initialize messages
    setCurrentMessages(loadingMessages.map(msg => ({ ...msg, completed: false })));

    // Loading animation with progress bar - slower for longer duration
    const progressSteps = totalDuration / 100; // 70ms per 1%
    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 1;
      });
    }, progressSteps);

    // Cycle through loading messages with checkmarks
    let messageIndex = 0;
    const messageInterval = setInterval(() => {
      setCurrentMessages((prev) => {
        if (messageIndex > 0 && messageIndex <= prev.length) {
          // Mark previous message as completed
          const updated = [...prev];
          updated[messageIndex - 1] = { ...updated[messageIndex - 1], completed: true };
          return updated;
        }
        return prev;
      });

      messageIndex++;
      
      // Stop when all messages are shown
      if (messageIndex > loadingMessages.length) {
        clearInterval(messageInterval);
      }
    }, totalDuration / loadingMessages.length); // Distribute messages across total duration

    // Start fading video out before transition
    const fadeStartTimeout = setTimeout(() => {
      setVideoOpacity(0);
    }, fadeStartTime);

    // Complete loading after fade completes
    const completeTimeout = setTimeout(() => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(fadeStartTimeout);
      onComplete();
    }, totalDuration);

    return () => {
      clearInterval(progressInterval);
      clearInterval(messageInterval);
      clearTimeout(fadeStartTimeout);
      clearTimeout(completeTimeout);
    };
  }, [onComplete, totalDuration, fadeStartTime]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[9999] bg-black flex flex-col items-center justify-center overflow-hidden"
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Background Video with Smooth Fade */}
        <motion.div
          className="absolute inset-0 -z-10"
          animate={{ opacity: videoOpacity }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          <video
            ref={videoRef}
            src="/loading.mp4"
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="auto"
            autoPlay
          />
        </motion.div>

        {/* Loading Gimmicks - Top Left */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 z-20">
          <div className="bg-black/70 backdrop-blur-sm border-2 border-white/20 rounded-lg p-4 space-y-2 min-w-[280px] font-mono">
            {currentMessages.map((message, index) => {
              const Icon = message.completed ? Check : message.icon;
              const isVisible = index < Math.ceil((currentMessages.length * loadingProgress) / 100);
              
              return (
                <motion.div
                  key={index}
                  className="flex items-center gap-2 text-sm text-white/90"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ 
                    opacity: isVisible ? 1 : 0,
                    x: isVisible ? 0 : -10
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {isVisible && (
                    <>
                      <Icon 
                        className={`w-4 h-4 ${message.completed ? 'text-green-500' : 'text-blue-400 animate-spin'}`} 
                        strokeWidth={2.5}
                      />
                      <span className={message.completed ? 'line-through text-white/60' : ''}>
                        {message.text}
                      </span>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Main Content Area - Centered */}
        <div className="flex flex-col items-center justify-center flex-1 relative z-10">
          {/* UrbanOS Logo with Glow and Subtle Shadow */}
          <motion.div
            className="relative w-48 h-48 md:w-64 md:h-64 mb-12"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{ 
              filter: 'drop-shadow(0 0 30px rgba(100, 150, 200, 0.8)) drop-shadow(0 0 60px rgba(100, 150, 200, 0.5)) drop-shadow(0 0 90px rgba(100, 150, 200, 0.3)) drop-shadow(0 8px 16px rgba(0, 0, 0, 0.4)) drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
            }}
          >
            <Image
              src="/logo.png"
              alt="UrbanOS Logo"
              fill
              sizes="(max-width: 768px) 192px, 256px"
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Pixelated Loading Progress Bar - Windows XP Style with Retro Feel */}
          <motion.div
            className="w-80 md:w-96 mt-4 relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            style={{ imageRendering: 'pixelated' }}
          >
            {/* Progress Bar Container - Dark gray with rounded ends */}
            <div 
              className="relative h-6 bg-[#1a1a1a] rounded-full overflow-hidden border-2 border-[#0a0a0a] shadow-inner"
              style={{ 
                imageRendering: 'pixelated' as const,
                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.8)'
              }}
            >
              {/* Progress Fill - Light blue gradient with pixelated look */}
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#4A9EE0] via-[#5BB5FF] to-[#4A9EE0] rounded-full"
                style={{ 
                  width: `${loadingProgress}%`,
                  imageRendering: 'pixelated' as const
                }}
                transition={{ duration: 0.05, ease: 'linear' }}
              >
                {/* Pixelated Shine Effect */}
                <div 
                  className="absolute inset-0 bg-gradient-to-r from-white/50 via-white/20 to-transparent rounded-full"
                  style={{ 
                    imageRendering: 'pixelated' as const
                  }}
                />
                {/* Pixelated Scanlines on progress */}
                <div 
                  className="absolute inset-0 opacity-60"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(255, 255, 255, 0.3) 2px, rgba(255, 255, 255, 0.3) 4px)',
                    imageRendering: 'pixelated' as const
                  }}
                />
              </motion.div>
              
              {/* Pixelated Glow behind progress */}
              <div 
                className="absolute inset-0 blur-sm opacity-50"
                style={{
                  background: `linear-gradient(to right, rgba(74, 158, 224, 0.7) 0%, rgba(74, 158, 224, 0.7) ${loadingProgress}%, transparent ${loadingProgress}%)`,
                  imageRendering: 'pixelated' as const
                }}
              />
            </div>
          </motion.div>
        </div>

        {/* Bottom Section - Copyright and Branding */}
        <div className="absolute bottom-0 left-0 right-0 pb-6 md:pb-8 z-10">
          {/* Copyright Text - Bottom Left */}
          <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8">
            <p className="text-xs md:text-sm text-white/90 font-normal font-sans" style={{ 
              textShadow: '0 0 5px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.8)',
              imageRendering: 'crisp-edges'
            }}>
              Copyright © 2025 UrbanOS Corporation
            </p>
          </div>

          {/* Branding - Bottom Right */}
          <div className="absolute bottom-6 right-6 md:bottom-8 md:right-8">
            <p className="text-sm md:text-base text-white/90 font-normal font-sans" style={{ 
              textShadow: '0 0 5px rgba(0, 0, 0, 1), 0 1px 2px rgba(0, 0, 0, 0.8)',
              imageRendering: 'crisp-edges'
            }}>
              UrbanOS®
            </p>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
