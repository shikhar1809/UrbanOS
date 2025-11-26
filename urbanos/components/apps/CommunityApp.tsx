'use client';

import { useState } from 'react';
import { CommunityOfficial } from '@/types';
import { Users, MessageSquare, Mail, Phone, MapPin, Briefcase, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import DiscussionRooms from './community/DiscussionRooms';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

type TabType = 'leaders' | 'discussions';

export default function CommunityApp() {
  const [activeTab, setActiveTab] = useState<TabType>('leaders');
  const [officials, setOfficials] = useState<CommunityOfficial[]>([]);
  const [filteredOfficials, setFilteredOfficials] = useState<CommunityOfficial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [regions, setRegions] = useState<string[]>([]);

  useEffect(() => {
    if (activeTab === 'leaders') {
      loadOfficials();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'leaders') {
      filterOfficials();
    }
  }, [selectedRegion, searchQuery, officials, activeTab]);

  const loadOfficials = async () => {
    try {
      const { data, error } = await supabase
        .from('community_officials')
        .select('*')
        .order('region', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      setOfficials(data || []);
      
      // Extract unique regions
      const uniqueRegions = Array.from(new Set((data || []).map((o) => o.region)));
      setRegions(uniqueRegions);
    } catch (error) {
      console.error('Error loading officials:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOfficials = () => {
    let filtered = officials;

    if (selectedRegion !== 'all') {
      filtered = filtered.filter((o) => o.region === selectedRegion);
    }

    if (searchQuery) {
      filtered = filtered.filter(
        (o) =>
          o.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.responsibilities.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredOfficials(filtered);
  };

  const tabs = [
    { id: 'leaders' as TabType, label: 'Know Your Leader', icon: Users },
    { id: 'discussions' as TabType, label: 'Discussion Rooms', icon: MessageSquare },
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-foreground/10 px-6 py-4">
        <div className="max-w-6xl mx-auto">
          <h3 className="text-xl font-bold mb-2">Know Your Community</h3>
          <p className="text-sm text-foreground/70 mb-4">
            Connect with community leaders and join discussions
          </p>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-foreground/10 -mb-4">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 flex items-center gap-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-windows-blue text-windows-blue'
                      : 'border-transparent text-foreground/70 hover:text-foreground hover:border-foreground/20'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'leaders' && (
            <>
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground/50" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by name, role, or responsibility..."
                    className="w-full pl-10 pr-4 py-2 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue text-sm"
                  />
                </div>
                <select
                  value={selectedRegion}
                  onChange={(e) => setSelectedRegion(e.target.value)}
                  className="px-4 py-2 bg-foreground/5 border border-foreground/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue text-sm"
                >
                  <option value="all">All Regions</option>
                  {regions.map((region) => (
                    <option key={region} value={region}>
                      {region}
                    </option>
                  ))}
                </select>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
                </div>
              ) : filteredOfficials.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center max-w-md">
                    <Users className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Officials Found</h3>
                    <p className="text-foreground/70">
                      {searchQuery || selectedRegion !== 'all'
                        ? 'Try adjusting your filters'
                        : 'No community officials have been added yet'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredOfficials.map((official, index) => (
                    <motion.div
                      key={official.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-foreground/5 rounded-xl p-6 hover:bg-foreground/10 transition-colors"
                    >
                      <div className="flex items-start gap-4 mb-4">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                          {official.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold mb-1">{official.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-foreground/70 mb-2">
                            <Briefcase className="w-4 h-4" />
                            {official.role}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-foreground/70">
                            <MapPin className="w-4 h-4" />
                            {official.region}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <h5 className="text-sm font-semibold mb-2 text-foreground/80">
                          Responsibilities
                        </h5>
                        <div className="flex flex-wrap gap-2">
                          {official.responsibilities.map((responsibility, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-windows-blue/10 text-windows-blue text-xs rounded-lg"
                            >
                              {responsibility}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-4 border-t border-foreground/10">
                        <a
                          href={`mailto:${official.email}`}
                          className="flex items-center gap-2 text-sm text-foreground/70 hover:text-windows-blue transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {official.email}
                        </a>
                        <a
                          href={`tel:${official.phone}`}
                          className="flex items-center gap-2 text-sm text-foreground/70 hover:text-windows-blue transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                          {official.phone}
                        </a>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'discussions' && <DiscussionRooms />}
        </div>
      </div>
    </div>
  );
}
