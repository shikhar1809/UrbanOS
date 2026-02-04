'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ParallaxVideoProps {
  className?: string;
}

export default function ParallaxVideo({
  className = ''
}: ParallaxVideoProps) {
  return (
    <div
      className={`relative min-h-screen w-full overflow-hidden ${className}`}
    >
      <div className="absolute inset-0 w-full h-full z-0">
        <Image
          src="/urbanos-city.jpg"
          alt="UrbanOS City"
          fill
          className="object-cover"
          style={{
            filter: 'blur(0.3px) contrast(0.9) brightness(0.95) saturate(0.8)',
            opacity: 0.75,
          }}
          priority
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
