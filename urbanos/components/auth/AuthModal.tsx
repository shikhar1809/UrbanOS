'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Chrome } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { handleError } from '@/lib/error-handler';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { showToast } = useToast();

  const { signInWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
      // OAuth redirects away, no need to show toast here
    } catch (err: any) {
      const errorInfo = handleError(err);
      setError(errorInfo.message);
      showToast(errorInfo.message, 'error');
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100]"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
          >
            <div className="glass-effect neo-border rounded overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-md border-b-4 border-black">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  Welcome to UrbanOS
                </h2>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded flex items-center justify-center bg-black text-white hover:bg-[#2C2C2C] transition-colors neo-border"
                >
                  <X className="w-5 h-5" strokeWidth={3} />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6 glass-effect">
                {error && (
                  <div className="bg-[#E85D75] neo-border rounded p-3 text-white text-sm font-bold">
                    ⚠️ {error}
                  </div>
                )}

                <div className="text-center space-y-4">
                  <p className="text-white font-bold text-lg">
                    Sign in with your Google account to continue
                  </p>

                  <button
                    type="button"
                    onClick={handleGoogleSignIn}
                    disabled={loading}
                    className="w-full py-4 bg-[#4285F4] hover:bg-[#357AE8] neo-border rounded font-black uppercase text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                  >
                    <Chrome className="w-6 h-6" strokeWidth={3} />
                    {loading ? 'Signing in...' : 'Sign in with Google'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
