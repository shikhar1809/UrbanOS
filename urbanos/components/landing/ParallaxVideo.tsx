'use client';

import { ContainerScroll } from '@/components/ui/container-scroll-animation';
import Image from 'next/image';

interface ParallaxVideoProps {
  className?: string;
}

export default function ParallaxVideo({
  className = ''
}: ParallaxVideoProps) {
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
        <Image
          src="/urbanos-interface.png"
          alt="UrbanOS Interface"
          width={1920}
          height={1080}
          className="w-full h-full object-cover object-center rounded-lg"
          priority
        />
      </ContainerScroll>
    </div>
  );
}
