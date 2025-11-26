'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

interface ParallaxImageBackgroundProps {
  children: React.ReactNode;
}

export default function ParallaxImageBackground({ 
  children
}: ParallaxImageBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const lastProgressRef = useRef<number>(0);
  const fallbackRafRef = useRef<number | undefined>(undefined);
  const previousScrollTimeRef = useRef<number>(0);
  
  // Track scroll progress from container start (Hero) to end (CallToAction)
  // Video completes one full cycle when reaching the end of the page
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  // Keep video visible throughout
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 1]);
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.1]);

  // Handle video metadata loaded
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      setIsVideoReady(true);
      // Set initial video time based on current scroll position
      const progress = Math.max(0, Math.min(1, scrollYProgress.get()));
      if (!isNaN(video.duration) && video.duration > 0) {
        video.currentTime = progress * video.duration;
      }
      video.pause();
    };

    const handleCanPlay = () => {
      video.pause();
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('canplay', handleCanPlay);
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  // Scroll-driven video playback using useMotionValueEvent
  // Enhanced with non-linear mapping to make video jump more frames per scroll
  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (!isVideoReady) return;
    
    const video = videoRef.current;
    if (!video) return;
    
    // Ensure video duration is valid
    const duration = video.duration;
    if (isNaN(duration) || duration <= 0 || !isFinite(duration)) return;

    // Get current scroll progress (0 to 1)
    const progress = Math.max(0, Math.min(1, latest));
    
    // Calculate scroll delta (how much scroll changed)
    const scrollDelta = Math.abs(progress - lastProgressRef.current);
    
    // Apply power function to make mapping more aggressive
    // Using progress^0.7 makes the video respond more quickly (non-linear acceleration)
    const responsiveProgress = Math.pow(progress, 0.7);
    
    // Calculate base target time
    const baseTargetTime = responsiveProgress * duration;
    
    // Amplify jumps based on scroll speed
    // Faster scrolling (larger delta) = larger frame jumps
    const currentVideoTime = video.currentTime || previousScrollTimeRef.current;
    const timeDifference = baseTargetTime - currentVideoTime;
    
    // Multiply by amplification factor - larger deltas get bigger multipliers
    // This makes each scroll jump multiple frames instead of one-by-one
    const jumpMultiplier = 1 + (scrollDelta * 15); // 1x to 16x based on scroll speed
    const amplifiedJump = timeDifference * jumpMultiplier;
    const targetTime = Math.max(0, Math.min(duration, currentVideoTime + amplifiedJump));
    
    // Store progress and time for next calculation
    lastProgressRef.current = progress;
    previousScrollTimeRef.current = targetTime;
    
    // Ensure targetTime is valid and within video duration bounds
    if (isNaN(targetTime) || !isFinite(targetTime)) return;
    if (targetTime < 0 || targetTime > duration) return;
    
    // Always keep video paused to maintain manual control
    if (!video.paused) {
      video.pause();
    }
    
    // Update video time with amplified jump - this makes it feel more alive and responsive
    try {
      video.currentTime = targetTime;
    } catch (error) {
      // If seeking fails, try again on next frame
      requestAnimationFrame(() => {
        const vid = videoRef.current;
        if (vid && isVideoReady) {
          try {
            vid.currentTime = targetTime;
          } catch {
            // Silent fail on retry
          }
        }
      });
    }
  });

  // Fallback: Ensure video stays synced even if events stop firing
  // This runs at a lower frequency (every ~100ms) to catch any drift
  useEffect(() => {
    if (!isVideoReady) {
      if (fallbackRafRef.current) {
        cancelAnimationFrame(fallbackRafRef.current);
        fallbackRafRef.current = undefined;
      }
      return;
    }

    let lastCheckTime = Date.now();
    
    const fallbackSync = () => {
      const video = videoRef.current;
      if (!video || !isVideoReady) return;

      const duration = video.duration;
      if (isNaN(duration) || duration <= 0 || !isFinite(duration)) {
        fallbackRafRef.current = requestAnimationFrame(fallbackSync);
        return;
      }

      // Only run fallback check every ~100ms to avoid performance issues
      const now = Date.now();
      if (now - lastCheckTime < 100) {
        fallbackRafRef.current = requestAnimationFrame(fallbackSync);
        return;
      }
      lastCheckTime = now;

      // Get current scroll progress
      const currentProgress = Math.max(0, Math.min(1, scrollYProgress.get()));
      const expectedTime = currentProgress * duration;
      const currentTime = video.currentTime;
      
      // If video time is significantly off from expected time (more than 0.1s), sync it
      if (Math.abs(currentTime - expectedTime) > 0.1 && !isNaN(expectedTime) && isFinite(expectedTime)) {
        try {
          if (!video.paused) video.pause();
          video.currentTime = expectedTime;
          lastProgressRef.current = currentProgress;
        } catch {
          // Silent fail
        }
      }

      fallbackRafRef.current = requestAnimationFrame(fallbackSync);
    };

    fallbackRafRef.current = requestAnimationFrame(fallbackSync);

    return () => {
      if (fallbackRafRef.current) {
        cancelAnimationFrame(fallbackRafRef.current);
        fallbackRafRef.current = undefined;
      }
    };
  }, [isVideoReady, scrollYProgress]);

  return (
    <div ref={containerRef} className="relative w-full" style={{ position: 'relative' }}>
      {/* Parallax Video Background - Fixed position, scroll-driven playback */}
      <div className="fixed inset-0 w-full h-full z-[-5] pointer-events-none overflow-hidden">
        <motion.div
          style={{ 
            opacity,
            scale
          }}
          className="absolute inset-0 w-full h-full"
        >
          <video
            ref={videoRef}
            src="/Scroll_website.mp4"
            className="absolute inset-0 w-full h-full object-cover"
            muted
            playsInline
            preload="auto"
            disablePictureInPicture
            disableRemotePlayback
            style={{
              willChange: 'transform',
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          />
        </motion.div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
