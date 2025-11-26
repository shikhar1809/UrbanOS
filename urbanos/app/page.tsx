'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import Hero from '@/components/landing/Hero';
import ImpactSphere from '@/components/landing/ImpactSphere';
import FeaturesShowcase from '@/components/landing/FeaturesShowcase';
import CallToAction from '@/components/landing/CallToAction';
import BackgroundShaders from '@/components/ui/background-shaders';
import ClickSpark from '@/components/ui/ClickSpark';
import ParallaxVideo from '@/components/landing/ParallaxVideo';
import Navbar from '@/components/landing/Navbar';
import ParallaxImageBackground from '@/components/landing/ParallaxImageBackground';

export default function Home() {
  useEffect(() => {
    // Initialize Lenis smooth scroll with optimized settings
    const lenis = new Lenis({
      duration: 1.2, // Scroll animation duration
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Smooth easing function
      orientation: 'vertical' as const,
      gestureOrientation: 'vertical' as const,
      smoothWheel: true, // Enable smooth mouse wheel scrolling
      wheelMultiplier: 1, // Scroll sensitivity
      touchMultiplier: 2,
      infinite: false,
      lerp: 0.1, // Linear interpolation for smoother motion
    });

    // Animation frame loop - runs every frame for smooth scrolling
    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    // Cleanup on unmount
    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <>
      {/* Animated Shader Background */}
      <BackgroundShaders />
      
      {/* Navigation Bar */}
      <Navbar />
      
      <ClickSpark
        sparkColor='#00ffff'
        sparkSize={12}
        sparkRadius={20}
        sparkCount={8}
        duration={500}
      >
        <main className="w-full min-h-screen relative" style={{ position: 'relative' }}>
          {/* Parallax Video Background - extends from Hero all the way to CallToAction */}
          <ParallaxImageBackground>
            <Hero />
            <ParallaxVideo />
            <ImpactSphere />
            <FeaturesShowcase />
            <CallToAction />
          </ParallaxImageBackground>
      </main>
      </ClickSpark>
    </>
  );
}
