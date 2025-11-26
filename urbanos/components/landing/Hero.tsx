'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export default function Hero() {
  return (
    <section className="relative min-h-screen w-full overflow-hidden flex items-center justify-center">
      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-4 py-20">
        {/* UrbanOS Logo - Center */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
          className="relative w-64 h-64 md:w-80 md:h-80 mb-8"
          style={{
            filter: 'drop-shadow(0 8px 24px rgba(0, 0, 0, 0.3)) drop-shadow(0 4px 12px rgba(0, 0, 0, 0.25)) drop-shadow(0 2px 6px rgba(0, 0, 0, 0.2))',
          }}
        >
          <Image
            src="/logo.png"
            alt="UrbanOS Logo"
            fill
            sizes="(max-width: 768px) 256px, 320px"
            className="object-contain"
            priority
          />
        </motion.div>
          
        {/* Tagline box */}
        <motion.div
          className="bg-white neo-border px-8 py-6 mb-8 rounded-lg interactive-element"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
          }}
          whileHover={{ 
            scale: 1.05,
            rotate: -1
          }}
          transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
        >
          <h2 className="text-hero font-black text-[#1a2332] uppercase tracking-tighter">
            Your City, Your Voice
          </h2>
        </motion.div>

        <motion.div
          className="bg-[#7FDBDB] neo-border px-8 py-5 max-w-3xl rounded-lg interactive-element"
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: 1,
            y: 0
          }}
          whileHover={{ 
            scale: 1.03,
            rotate: 1
          }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
        >
          <p className="text-body-large text-black font-bold leading-relaxed">
            Empowering citizens to report issues, connect with community leaders,
            and make cities safer through community-driven initiatives.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
