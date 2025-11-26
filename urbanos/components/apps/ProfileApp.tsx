'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { User, Mail, MapPin, Briefcase, Save, Bell, Moon, Sun } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthModal from '@/components/auth/AuthModal';

export default function ProfileApp() {
  const { user, profile, signOut } = useAuth();
  const [fullName, setFullName] = useState('');
  const [region, setRegion] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [notificationPrefs, setNotificationPrefs] = useState({
    reportUpdates: true,
    agencyResponses: true,
    securityAlerts: true,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setRegion(profile.region || '');
    }
  }, [profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: fullName,
          region: region,
        })
        .eq('id', user.id);

      if (error) throw error;

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <User className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Sign In Required</h3>
            <p className="text-foreground/70 mb-6">
              Please sign in to view and edit your profile.
            </p>
            <button
              onClick={() => setShowAuthModal(true)}
              className="px-8 py-3 bg-windows-blue text-white rounded-lg font-semibold hover:bg-windows-blue-hover transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Profile Header */}
          <div className="bg-gradient-to-br from-windows-blue to-accent-gradient-start rounded-xl p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold">
                {(profile?.full_name || user.email || 'U').charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{profile?.full_name || 'User'}</h2>
                <p className="text-white/80">{user.email}</p>
                <span className="inline-block mt-2 px-3 py-1 bg-white/20 rounded-full text-sm capitalize">
                  {profile?.role || 'citizen'}
                </span>
              </div>
            </div>
          </div>

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-center gap-3"
            >
              <Save className="w-5 h-5 text-green-500" />
              <p className="text-green-500 text-sm">Profile updated successfully!</p>
            </motion.div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSaveProfile} className="bg-foreground/5 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4">Profile Information</h3>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <User className="w-4 h-4" />
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-4 py-3 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Mail className="w-4 h-4" />
                Email
              </label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full px-4 py-3 bg-foreground/10 border border-foreground/20 rounded-lg opacity-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <MapPin className="w-4 h-4" />
                Region
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full px-4 py-3 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue"
                placeholder="Enter your region"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                <Briefcase className="w-4 h-4" />
                Role
              </label>
              <input
                type="text"
                value={profile?.role || 'citizen'}
                disabled
                className="w-full px-4 py-3 bg-foreground/10 border border-foreground/20 rounded-lg opacity-50 cursor-not-allowed capitalize"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 bg-windows-blue text-white rounded-lg font-semibold hover:bg-windows-blue-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          {/* Notification Preferences */}
          <div className="bg-foreground/5 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notification Preferences
            </h3>

            <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg cursor-pointer">
              <span className="text-sm">Report Status Updates</span>
              <input
                type="checkbox"
                checked={notificationPrefs.reportUpdates}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, reportUpdates: e.target.checked })
                }
                className="w-5 h-5 rounded accent-windows-blue"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg cursor-pointer">
              <span className="text-sm">Agency Responses</span>
              <input
                type="checkbox"
                checked={notificationPrefs.agencyResponses}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, agencyResponses: e.target.checked })
                }
                className="w-5 h-5 rounded accent-windows-blue"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-foreground/5 rounded-lg cursor-pointer">
              <span className="text-sm">Security Alerts</span>
              <input
                type="checkbox"
                checked={notificationPrefs.securityAlerts}
                onChange={(e) =>
                  setNotificationPrefs({ ...notificationPrefs, securityAlerts: e.target.checked })
                }
                className="w-5 h-5 rounded accent-windows-blue"
              />
            </label>
          </div>

          {/* Theme Selection */}
          <div className="bg-foreground/5 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Appearance</h3>
            <div className="flex gap-4">
              <button
                onClick={() => setTheme('light')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme === 'light'
                    ? 'border-windows-blue bg-windows-blue/10'
                    : 'border-foreground/20 hover:border-foreground/40'
                }`}
              >
                <Sun className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex-1 p-4 rounded-lg border-2 transition-all ${
                  theme === 'dark'
                    ? 'border-windows-blue bg-windows-blue/10'
                    : 'border-foreground/20 hover:border-foreground/40'
                }`}
              >
                <Moon className="w-6 h-6 mx-auto mb-2" />
                <span className="text-sm font-medium">Dark</span>
              </button>
            </div>
          </div>

          {/* Sign Out */}
          <button
            onClick={signOut}
            className="w-full py-3 bg-red-500/10 text-red-500 rounded-lg font-semibold hover:bg-red-500/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

