'use client';

import { motion } from 'framer-motion';
import AuthButton from '@/components/auth/AuthButton';

export default function Navbar() {
  return (
    <motion.nav 
      className="fixed top-0 left-0 right-0 z-50 p-6"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
    >
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Auth Button - Top Left */}
        <div className="flex items-center">
          <AuthButton />
        </div>

        {/* Optional: Add more nav items here on the right */}
        <div className="flex items-center gap-4">
          {/* You can add more navigation items here later */}
        </div>
      </div>
    </motion.nav>
  );
}

