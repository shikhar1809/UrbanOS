'use client';

import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import Image from 'next/image';
import { useState, useEffect } from 'react';

interface ParallaxVideoProps {
  className?: string;
}

const images = [
  "/urbanos-interface.png",
  "/urbanos-slide-1.png",
  "/urbanos-slide-2.png",
  "/urbanos-slide-3.png"
];

export default function ParallaxVideo({
  className = ''
}: ParallaxVideoProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full ${className}`}>
      <ContainerScroll
        titleComponent={
          <div className="text-center text-white px-4">
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-4">
              Experience UrbanOS
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl font-bold text-white/80">
              Community-Driven Civic Solutions
            </p>
          </div>
        }
      >
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-gray-900">
          <div className="absolute inset-0 w-full h-full">
            {images.map((img, index) => (
              <Image
                key={img}
                src={img}
                alt={`UrbanOS Interface Slide ${index + 1}`}
                fill
                className={`w-full h-full object-cover object-center transition-none ${index === currentImageIndex ? 'visible z-10' : 'invisible z-0'
                  }`}
                priority={index === 0}
              />
            ))}
          </div>

          {/* Overlay gradient for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />

          {/* Slide indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentImageIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/80'
                  }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </ContainerScroll>
    </div>
  );
}
