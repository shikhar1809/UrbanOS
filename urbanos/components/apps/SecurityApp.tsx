'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { Shield, AlertTriangle, Eye, EyeOff, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import AuthModal from '@/components/auth/AuthModal';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('@/components/apps/reports/LocationPicker'), { ssr: false });

interface SecurityIncident {
  id: string;
  type: string;
  title?: string;
  description: string;
  is_anonymous: boolean;
  created_at: string;
  location?: {
    lat: number;
    lng: number;
    address: string;
  } | string;
}

const incidentTypes = [
  { value: 'phishing', label: 'Phishing Email', icon: '📧', description: 'Suspicious emails or messages' },
  { value: 'scam-call', label: 'Scam Call', icon: '📞', description: 'Fraudulent phone calls' },
  { value: 'fraud', label: 'Online Fraud', icon: '💳', description: 'Financial scams or fraud' },
  { value: 'data-breach', label: 'Data Breach', icon: '🔓', description: 'Exposed personal information' },
  { value: 'malware', label: 'Malware/Virus', icon: '🦠', description: 'Malicious software' },
  { value: 'other', label: 'Other', icon: '🔒', description: 'Other security concerns' },
];

export default function SecurityApp() {
  const { user } = useAuth();
  const [view, setView] = useState<'report' | 'alerts'>('report');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [selectedType, setSelectedType] = useState('phishing');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [alerts, setAlerts] = useState<SecurityIncident[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (user) {
      createDemoIncidentsIfNeeded();
      loadAlerts();
      subscribeToAlerts();
    }
  }, [user]);

  const createDemoIncidentsIfNeeded = async () => {
    if (!user) return;

    try {
      // Check if demo incidents already exist
      const { data: existing, error: checkError } = await supabase
        .from('reports')
        .select('id')
        .eq('type', 'cybersecurity')
        .limit(1);

      if (checkError) {
        console.error('Error checking for demo incidents:', checkError);
        return;
      }

      // If incidents exist, don't create new ones
      if (existing && existing.length > 0) {
        return;
      }

      // Create demo cybersecurity incidents (not anonymous so they show on map)
      const demoIncidents = [
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Phishing Email Report',
          description: 'Received suspicious email claiming to be from bank asking for account details. Email had poor grammar and suspicious links. Reported immediately.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Hazratganj, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'high',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Scam Call Report',
          description: 'Received call from unknown number claiming to be tech support. Caller asked for remote access to computer. Hung up immediately.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Gomti Nagar, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'medium',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Online Fraud Report',
          description: 'Fake online shopping website took payment but never delivered goods. Website disappeared after payment. Lost ₹5,000.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Indira Nagar, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'high',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Data Breach Report',
          description: 'Noticed unauthorized login attempts on social media account. Changed password immediately. Suspect account may have been compromised.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Alambagh, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'high',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Malware/Virus Report',
          description: 'Computer started showing pop-ups and running slowly. Antivirus detected trojan. System cleaned but want to report the source.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Aminabad, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'medium',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Phishing Email Report',
          description: 'Email from fake government agency asking for Aadhaar details. Email looked official but had suspicious sender address.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Vikramaditya Marg, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'medium',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Scam Call Report',
          description: 'Caller claimed to be from income tax department asking for bank account details. Knew it was a scam and reported it.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Rana Pratap Marg, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'high',
        },
        {
          user_id: user.id,
          type: 'cybersecurity',
          title: 'Online Fraud Report',
          description: 'Fake job offer website asked for registration fee. After payment, website became inaccessible. Lost ₹3,000.',
          location: { lat: 26.8467 + (Math.random() - 0.5) * 0.05, lng: 80.9462 + (Math.random() - 0.5) * 0.05, address: 'Kanpur Road, Lucknow' },
          is_anonymous: false,
          source: 'web',
          status: 'submitted',
          priority: 'high',
        },
      ];

      // Insert demo incidents with staggered timestamps (spread over last 7 days)
      const now = new Date();
      for (let i = 0; i < demoIncidents.length; i++) {
        const daysAgo = Math.floor(Math.random() * 7);
        const hoursAgo = Math.floor(Math.random() * 24);
        const incidentDate = new Date(now);
        incidentDate.setDate(incidentDate.getDate() - daysAgo);
        incidentDate.setHours(incidentDate.getHours() - hoursAgo);

        const { error: insertError } = await supabase.from('reports').insert({
          ...demoIncidents[i],
          created_at: incidentDate.toISOString(),
          submitted_at: incidentDate.toISOString(),
        });

        if (insertError) {
          console.error('Error creating demo incident:', insertError);
        }
      }

      console.log('Demo cybersecurity incidents created');
    } catch (error) {
      console.error('Error creating demo incidents:', error);
    }
  };

  const loadAlerts = async () => {
    try {
      // Load recent cybersecurity incidents (anonymized)
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('type', 'cybersecurity')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    }
  };

  const subscribeToAlerts = () => {
    const channel = supabase
      .channel('security_alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'reports',
          filter: 'type=eq.cybersecurity',
        },
        () => {
          loadAlerts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!location) {
      setError('Please select a location on the map');
      return;
    }

    setError('');
    setLoading(true);
    setSuccess(false);

    try {
      const { error: insertError } = await supabase.from('reports').insert({
        user_id: user.id,
        type: 'cybersecurity',
        title: `${incidentTypes.find((t) => t.value === selectedType)?.label} Report`,
        description,
        location: location,
        is_anonymous: isAnonymous,
        source: 'web',
        status: 'submitted',
        priority: 'medium',
      });

      if (insertError) throw insertError;

      // Reset form
      setDescription('');
      setLocation(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <>
        <div className="p-6 flex items-center justify-center min-h-[400px]">
          <div className="text-center max-w-md">
            <Shield className="w-16 h-16 text-purple-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Sign In Required</h3>
            <p className="text-foreground/70 mb-6">
              Please sign in to report security incidents and receive alerts.
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
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold">Cybersecurity Alerts</h3>
            <p className="text-sm text-foreground/70">Report threats and stay informed</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setView('report')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'report'
                  ? 'bg-purple-500 text-white'
                  : 'bg-foreground/10 hover:bg-foreground/20'
              }`}
            >
              Report Incident
            </button>
            <button
              onClick={() => setView('alerts')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                view === 'alerts'
                  ? 'bg-purple-500 text-white'
                  : 'bg-foreground/10 hover:bg-foreground/20'
              }`}
            >
              View Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'report' ? (
          <div className="p-6">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-500 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3"
                >
                  <Shield className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-green-500 text-sm">Report submitted successfully!</p>
                </motion.div>
              )}

              {/* Anonymous Toggle */}
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isAnonymous ? (
                      <EyeOff className="w-5 h-5 text-purple-500" />
                    ) : (
                      <Eye className="w-5 h-5 text-purple-500" />
                    )}
                    <div>
                      <h4 className="font-semibold text-sm">Anonymous Reporting</h4>
                      <p className="text-xs text-foreground/70">
                        {isAnonymous
                          ? 'Your identity will be protected'
                          : 'Your identity will be visible to agencies'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(!isAnonymous)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      isAnonymous ? 'bg-purple-500' : 'bg-foreground/20'
                    }`}
                  >
                    <div
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        isAnonymous ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Incident Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Incident Type
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {incidentTypes.map((type) => (
                    <label key={type.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type.value}
                        checked={selectedType === type.value}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="sr-only peer"
                      />
                      <div className="p-4 bg-foreground/5 border-2 border-foreground/10 rounded-xl peer-checked:border-purple-500 peer-checked:bg-purple-500/10 transition-all hover:bg-foreground/10">
                        <div className="text-2xl mb-2">{type.icon}</div>
                        <div className="text-sm font-medium mb-1">{type.label}</div>
                        <div className="text-xs text-foreground/70">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Location Picker */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Location <span className="text-red-500">*</span>
                </label>
                <LocationPicker onLocationSelect={setLocation} />
                {location && (
                  <p className="text-xs text-foreground/70 mt-2">
                    Selected: {location.address}
                  </p>
                )}
                {!location && (
                  <p className="text-xs text-foreground/50 mt-2">
                    Click on the map to select the incident location
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Incident Details
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 h-40 resize-none"
                  placeholder="Describe what happened, when it occurred, and any relevant details..."
                  required
                />
                <p className="text-xs text-foreground/50 mt-2">
                  {isAnonymous && '🔒 This information will be anonymized before storage'}
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  'Submitting...'
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Report
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-4xl mx-auto">
              <h4 className="text-lg font-semibold mb-4">Recent Security Alerts</h4>
              {alerts.length === 0 ? (
                <div className="bg-foreground/5 rounded-xl p-8 text-center">
                  <Shield className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                  <p className="text-foreground/50">No recent security alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert, index) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-foreground/5 rounded-xl p-4 border-l-4 border-purple-500"
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h5 className="font-semibold mb-1">
                            {(alert as any).title || 'Security Incident'}
                          </h5>
                          <p className="text-sm text-foreground/70 mb-2">
                            {(alert as any).description || 'No description available'}
                          </p>
                          <p className="text-xs text-foreground/60 mb-1">
                            {alert.is_anonymous ? 'Anonymous report' : 'Verified report'}
                          </p>
                          {(alert as any).location && typeof (alert as any).location === 'object' && (alert as any).location.address && (
                            <p className="text-xs text-foreground/60 mb-1">
                              📍 {(alert as any).location.address}
                            </p>
                          )}
                          <p className="text-xs text-foreground/50">
                            {new Date(alert.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

