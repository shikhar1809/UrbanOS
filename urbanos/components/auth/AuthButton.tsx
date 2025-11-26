'use client';

import { motion } from 'framer-motion';
import { LogIn, LogOut, User } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useState } from 'react';
import AuthModal from './AuthModal';

export default function AuthButton() {
  const { user, profile, signOut, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  if (loading) {
    return (
      <div className="w-12 h-12 rounded bg-white/10 neo-border animate-pulse" />
    );
  }

  if (!user) {
    return (
      <>
        <motion.button
          onClick={() => setShowAuthModal(true)}
          className="px-8 py-3 bg-white text-black rounded font-black uppercase text-sm tracking-tight flex items-center gap-2"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <LogIn className="w-5 h-5" strokeWidth={3} />
          Sign In
        </motion.button>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="relative">
      <motion.button
        onClick={() => setShowMenu(!showMenu)}
        className="w-12 h-12 rounded bg-[#7FDBDB] neo-border flex items-center justify-center"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <User className="w-6 h-6 text-black" strokeWidth={3} />
      </motion.button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-0 mt-2 w-64 bg-white neo-border rounded overflow-hidden z-20"
          >
            <div className="p-4 border-b-4 border-black bg-[#D4C5A9]">
              <div className="font-black text-black uppercase text-sm">
                {profile?.full_name || 'User'}
              </div>
              <div className="text-xs text-black font-bold mt-1">{user.email}</div>
              <div className="text-xs font-bold mt-1 capitalize bg-black text-white px-2 py-1 inline-block rounded">
                {profile?.role || 'citizen'}
              </div>
            </div>
            <button
              onClick={() => {
                signOut();
                setShowMenu(false);
              }}
              className="w-full px-4 py-3 text-left bg-[#E85D75] hover:bg-[#d14963] transition-colors flex items-center gap-2 text-white font-black uppercase text-sm border-t-4 border-black"
            >
              <LogOut className="w-4 h-4" strokeWidth={3} />
              Sign Out
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}
