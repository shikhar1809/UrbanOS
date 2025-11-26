'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, AlertCircle, CheckCircle } from 'lucide-react';

interface ESignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureData: {
    name: string;
    email: string;
    consent: boolean;
    timestamp: string;
    ip: string;
    userAgent: string;
  }) => void;
  reportTitle: string;
}

export default function ESignatureModal({
  isOpen,
  onClose,
  onConfirm,
  reportTitle,
}: ESignatureModalProps) {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [ipAddress, setIpAddress] = useState<string>('');
  const [userAgent, setUserAgent] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Pre-fill from auth context
      setName(profile?.full_name || user?.email?.split('@')[0] || '');
      setEmail(user?.email || '');

      // Get IP address (simplified - in production use a proper service)
      fetch('https://api.ipify.org?format=json')
        .then((res) => res.json())
        .then((data) => setIpAddress(data.ip))
        .catch(() => setIpAddress('Unknown'));

      // Get user agent
      setUserAgent(navigator.userAgent);
    }
  }, [isOpen, user, profile]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      return;
    }

    if (!consent) {
      return;
    }

    onConfirm({
      name: name.trim(),
      email: email.trim(),
      consent: true,
      timestamp: new Date().toISOString(),
      ip: ipAddress,
      userAgent: userAgent,
    });

    // Reset and close
    setConsent(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gray-900 rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border-2 border-gray-700">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">E-Signature Consent</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Report Info */}
          <div className="bg-windows-blue/20 border border-windows-blue/40 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-300 mb-1">You are signing for:</p>
            <p className="font-semibold text-white">{reportTitle}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue text-white placeholder-gray-400"
                required
                placeholder="Enter your full name"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-2 text-white">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue text-white placeholder-gray-400"
                required
                placeholder="Enter your email"
              />
            </div>

            {/* Legal Disclaimer */}
            <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm space-y-2">
                  <p className="font-semibold text-white">Legal Notice</p>
                  <p className="text-gray-300">
                    By providing your e-signature, you acknowledge that:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-gray-300 ml-2">
                    <li>
                      You consent to this report becoming a Community Report if it reaches 50 upvotes
                    </li>
                    <li>
                      Your name and signature may be included in official documents sent to authorities
                    </li>
                    <li>
                      Your e-signature is legally binding and equivalent to a physical signature
                    </li>
                    <li>
                      This action will be recorded with your IP address ({ipAddress}) and timestamp
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Consent Checkbox */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-gray-600 bg-gray-800 text-windows-blue focus:ring-windows-blue"
                required
              />
              <label htmlFor="consent" className="text-sm cursor-pointer text-white">
                I have read and understood the legal notice above, and I consent to provide my
                e-signature for this report. <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Signature Info Display */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 text-xs text-gray-400 space-y-1">
              <p>
                <strong className="text-gray-300">Timestamp:</strong> {new Date().toLocaleString()}
              </p>
              <p>
                <strong className="text-gray-300">IP Address:</strong> {ipAddress || 'Loading...'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || !email.trim() || !consent}
                className="px-6 py-2 bg-windows-blue text-white rounded-lg font-semibold hover:bg-windows-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Sign & Upvote
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

