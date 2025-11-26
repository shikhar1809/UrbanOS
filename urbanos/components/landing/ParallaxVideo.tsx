'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface ParallaxVideoProps {
  className?: string;
}

export default function ParallaxVideo({ 
  className = '' 
}: ParallaxVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  const MAIN_VIDEO = '/Main_Animation.mp4';

  // Initialize video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedMetadata = () => {
      console.log('Video metadata loaded, duration:', video.duration);
      setIsVideoReady(true);
      video.currentTime = 0;
    };

    // Setup video
    video.src = MAIN_VIDEO;
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.load();

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
  }, []);

  // Auto-play video when component is in view
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Play video if paused
            if (video.paused && video.readyState >= 2) {
              video.play().catch(() => {
                // Autoplay prevented - browser policy
              });
            }
          } else {
            // Pause when out of view
            if (!video.paused) {
              video.pause();
            }
          }
        });
      },
      {
        threshold: 0.3,
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [isVideoReady]);

  const videoStyle = {
    willChange: 'opacity',
    transform: 'translateZ(0)',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    mixBlendMode: 'soft-light',
    opacity: 0.75,
    filter: 'blur(0.3px) contrast(0.9) brightness(0.95) saturate(0.8)',
  } as React.CSSProperties;

  return (
    <div 
      ref={containerRef} 
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          ref={videoRef}
          src={MAIN_VIDEO}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          loop={true}
          preload="metadata"
          loading="lazy"
          disablePictureInPicture
          disableRemotePlayback
          style={videoStyle}
        />
      </div>

      {/* Content overlay - Experience UrbanOS */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: false }}
          className="text-center text-white px-4"
        >
          <motion.h2 
            className="text-4xl md:text-6xl lg:text-7xl font-black mb-4 text-on-shader"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
            viewport={{ once: false }}
          >
            Experience UrbanOS
          </motion.h2>
          <motion.p 
            className="text-xl md:text-2xl lg:text-3xl font-bold text-on-shader-subtle"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
            viewport={{ once: false }}
          >
            Community-Driven Civic Solutions
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}
