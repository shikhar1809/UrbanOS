'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Report } from '@/types';
import { Award, Users, Clock, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { motion } from 'framer-motion';
import CommunityReportDetail from './CommunityReportDetail';

interface CommunityReport {
  id: string;
  report_id: string;
  curator_id: string;
  upvote_count: number;
  status: 'active' | 'resolved' | 'escalated_to_pil';
  promoted_at: string;
  report?: Report;
  curator?: {
    full_name: string | null;
    email: string;
  };
}

export default function CommunityReportsList() {
  const [communityReports, setCommunityReports] = useState<CommunityReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved' | 'escalated_to_pil'>('all');
  const [selectedReport, setSelectedReport] = useState<CommunityReport | null>(null);

  useEffect(() => {
    loadCommunityReports();
  }, [filter]);

  const loadCommunityReports = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('community_reports')
        .select(`
          *,
          report:reports(*),
          curator:users!curator_id(full_name, email)
        `)
        .order('promoted_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out community reports that don't meet 50 upvote criteria
      const validCommunityReports = (data || []).filter((cr: CommunityReport) => {
        return cr.upvote_count >= 50;
      });

      console.log(`Filtered community reports: ${data?.length || 0} total, ${validCommunityReports.length} with 50+ upvotes`);

      // List of demo report titles
      const demoReportTitles = [
        'Large pothole on MG Road near Hazratganj crossing',
        'Streetlights not working on Vikramaditya Marg',
        'Garbage not being collected in Aminabad market area',
        'Dead dog on main road in Indira Nagar Sector 14',
        'Multiple potholes on Kanpur Road near Alambagh bus stand',
        'Flickering streetlight near Hazratganj metro station',
        'Garbage dump near residential complex in Gomti Nagar',
        'Dead cow on Lucknow-Kanpur highway',
        'Pothole on Rana Pratap Marg - RESOLVED',
        'Broken divider on Shaheed Path causing accidents'
      ];
      
      // Demo user names to use for demo reports
      const demoUserNames = [
        { full_name: 'Rahul Sharma', email: 'rahul.sharma@demo.urbanos.in' },
        { full_name: 'Priya Patel', email: 'priya.patel@demo.urbanos.in' },
        { full_name: 'Amit Kumar', email: 'amit.kumar@demo.urbanos.in' },
        { full_name: 'Kavita Singh', email: 'kavita.singh@demo.urbanos.in' },
        { full_name: 'Vijay Verma', email: 'vijay.verma@demo.urbanos.in' },
        { full_name: 'Neha Gupta', email: 'neha.gupta@demo.urbanos.in' },
        { full_name: 'Rohan Mishra', email: 'rohan.mishra@demo.urbanos.in' },
        { full_name: 'Anita Tiwari', email: 'anita.tiwari@demo.urbanos.in' },
        { full_name: 'Sanjay Yadav', email: 'sanjay.yadav@demo.urbanos.in' },
        { full_name: 'Meera Shah', email: 'meera.shah@demo.urbanos.in' }
      ];
      
      // Get current user once at the start (already fetched above if needed)
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Fetch creator info separately for each report (more reliable)
      const reportsWithCreators = await Promise.all(
        (validCommunityReports || []).map(async (cr: any, index: number) => {
          const report = cr.report;
          if (report) {
            // Check if this is a demo report
            const isDemoReport = demoReportTitles.includes(report.title);
            
            // Fetch creator info separately
            let creator = null;
            try {
              const { data: userData } = await supabase
                .from('users')
                .select('id, full_name, email')
                .eq('id', report.user_id)
                .single();
              
              if (userData) {
                // If this is a demo report AND it's assigned to the logged-in user, use a fake demo creator
                if (isDemoReport && currentUser && report.user_id === currentUser.id) {
                  // Use a consistent demo user based on the report index
                  const demoUser = demoUserNames[index % demoUserNames.length];
                  creator = {
                    id: report.user_id, // Keep the same ID for RLS purposes
                    full_name: demoUser.full_name,
                    email: demoUser.email
                  };
                } else {
                  creator = userData;
                }
              } else if (isDemoReport && currentUser && report.user_id === currentUser.id) {
                // If userData is null but it's a demo report, still use fake creator
                const demoUser = demoUserNames[index % demoUserNames.length];
                creator = {
                  id: report.user_id,
                  full_name: demoUser.full_name,
                  email: demoUser.email
                };
              }
            } catch (err) {
              console.warn('Error fetching creator for report:', report.id, err);
            }
            
            report.creator = creator;
            report.videos = Array.isArray(report.videos) ? report.videos : [];
            report.images = Array.isArray(report.images) ? report.images : [];
          }
          return {
            ...cr,
            report: report,
          };
        })
      );

      // Add demo data for resolved and escalated PIL when filtering or when no data exists
      let reportsWithDemo = [...reportsWithCreators];
      const hasResolved = reportsWithDemo.some(r => r.status === 'resolved');
      const hasEscalated = reportsWithDemo.some(r => r.status === 'escalated_to_pil');
      
      // Create demo resolved report if needed (always when filtering by resolved, or in 'all' view if none exist)
      if (filter === 'resolved' || (filter === 'all' && !hasResolved)) {
        // Get first report or use defaults for demo
        const firstReport = reportsWithDemo[0];
        const defaultCuratorId = firstReport?.curator_id || currentUser?.id || 'demo-user-id';
        const defaultReportId = firstReport?.report_id || 'demo-report-id';
        
        // Ensure we have a valid report object for demo
        const baseReport = reportsWithDemo[0]?.report || null;
        
        const resolvedDemo: CommunityReport = {
          id: 'demo-resolved-001',
          report_id: baseReport?.id || defaultReportId,
          curator_id: defaultCuratorId,
          upvote_count: 25,
          status: 'resolved',
          promoted_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          report: baseReport ? {
            ...baseReport,
            title: 'Pothole on Rana Pratap Marg - RESOLVED',
            description: 'Large pothole on Rana Pratap Marg near Hazratganj crossing. Issue has been successfully resolved by the municipal corporation.',
            status: 'resolved',
          } : {
            id: 'demo-resolved-report',
            user_id: currentUser?.id || 'demo',
            type: 'pothole',
            title: 'Pothole on Rana Pratap Marg - RESOLVED',
            description: 'Large pothole on Rana Pratap Marg near Hazratganj crossing. Issue has been successfully resolved by the municipal corporation.',
            location: { lat: 26.8467, lng: 80.9462, address: 'Rana Pratap Marg, Hazratganj, Lucknow' },
            status: 'resolved',
            priority: 'medium',
            images: [],
            is_anonymous: false,
            source: 'web',
            agency_id: null,
            submitted_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            resolved_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            response_time_hours: 552,
            created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          curator: currentUser ? {
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Demo Curator',
            email: currentUser.email || 'demo@urbanos.in',
          } : {
            full_name: 'Demo Curator',
            email: 'demo@urbanos.in',
          },
        };
        
        if (filter === 'resolved') {
          reportsWithDemo = [resolvedDemo];
        } else {
          reportsWithDemo = [resolvedDemo, ...reportsWithDemo];
        }
      }
      
      // Create demo escalated PIL report if needed (always when filtering by escalated, or in 'all' view if none exist)
      if (filter === 'escalated_to_pil' || (filter === 'all' && !hasEscalated)) {
        // Get first report or use defaults for demo
        const firstReport = reportsWithDemo[0];
        const defaultCuratorId = firstReport?.curator_id || currentUser?.id || 'demo-user-id';
        const defaultReportId = firstReport?.report_id || 'demo-report-id';
        
        // Ensure we have a valid report object for demo
        const baseReportEscalated = reportsWithDemo[0]?.report || null;
        
        const escalatedDemo: CommunityReport = {
          id: 'demo-escalated-001',
          report_id: baseReportEscalated?.id || defaultReportId,
          curator_id: defaultCuratorId,
          upvote_count: 45,
          status: 'escalated_to_pil',
          promoted_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          report: baseReportEscalated ? {
            ...baseReportEscalated,
            title: 'Garbage not being collected in Aminabad market area - ESCALATED TO PIL',
            description: 'Persistent garbage collection issues in Aminabad market area. Multiple complaints filed. Escalated to Public Interest Litigation (PIL) for urgent court intervention.',
          } : {
            id: 'demo-escalated-report',
            user_id: currentUser?.id || 'demo',
            type: 'garbage',
            title: 'Garbage not being collected in Aminabad market area - ESCALATED TO PIL',
            description: 'Persistent garbage collection issues in Aminabad market area. Multiple complaints filed. Escalated to Public Interest Litigation (PIL) for urgent court intervention.',
            location: { lat: 26.8567, lng: 80.9362, address: 'Aminabad Market, Lucknow' },
            status: 'submitted',
            priority: 'high',
            images: [],
            is_anonymous: false,
            source: 'web',
            agency_id: null,
            submitted_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            resolved_at: null,
            response_time_hours: null,
            created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          },
          curator: currentUser ? {
            full_name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Demo Curator',
            email: currentUser.email || 'demo@urbanos.in',
          } : {
            full_name: 'Demo Curator',
            email: 'demo@urbanos.in',
          },
        };
        
        if (filter === 'escalated_to_pil') {
          reportsWithDemo = [escalatedDemo];
        } else {
          reportsWithDemo = [escalatedDemo, ...reportsWithDemo];
        }
      }

      setCommunityReports(reportsWithDemo);
    } catch (error) {
      console.error('Error loading community reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const statusColors = {
    active: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
    escalated_to_pil: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const statusIcons = {
    active: AlertTriangle,
    resolved: CheckCircle,
    escalated_to_pil: Award,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-windows-blue border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (communityReports.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <Award className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Community Reports Yet</h3>
          <p className="text-foreground/70">
            Community reports appear when reports reach 50+ upvotes. Start voting on reports to make them community reports!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        {(['all', 'active', 'resolved', 'escalated_to_pil'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === status
                ? 'bg-windows-blue text-white'
                : 'bg-foreground/5 hover:bg-foreground/10'
            }`}
          >
            {status === 'all' ? 'All' : status.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Community Reports List */}
      <div className="max-w-4xl mx-auto space-y-4">
        {communityReports.map((cr, index) => {
          const StatusIcon = statusIcons[cr.status];
          const report = cr.report as Report | undefined;

          if (!report) return null;

          return (
            <motion.div
              key={cr.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 rounded-xl p-6 hover:border-purple-500/50 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
            >
                <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <Award className="w-6 h-6 text-purple-300 animate-pulse" />
                    <h4 className="text-xl font-bold text-white">{report.title}</h4>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        cr.status === 'active' 
                          ? 'bg-yellow-500 text-white border-yellow-600'
                          : cr.status === 'resolved'
                          ? 'bg-green-500 text-white border-green-600'
                          : 'bg-red-500 text-white border-red-600'
                      } flex items-center gap-1`}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {cr.status.replace('_', ' ')}
                    </span>
                    <span className="px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white/30 flex items-center gap-1 shadow-lg">
                      <Award className="w-4 h-4" />
                      Community Report
                    </span>
                  </div>
                  <p className="text-sm text-white/90 mb-3 line-clamp-2">
                    {report.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-white/70">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {cr.upvote_count} upvotes
                    </span>
                    {report.creator && !report.is_anonymous && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {report.creator.full_name || report.creator.email.split('@')[0]}
                      </span>
                    )}
                    {report.is_anonymous && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Anonymous
                      </span>
                    )}
                    <span>Promoted {new Date(cr.promoted_at).toLocaleDateString()}</span>
                    {(cr as any).curator && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Curator: {(cr as any).curator?.full_name || (cr as any).curator?.email?.split('@')[0] || 'Unknown'}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Details Button */}
              <button
                onClick={() => setSelectedReport(cr)}
                className="inline-block mt-4 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-bold hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                View Details & Manage
              </button>
            </motion.div>
          );
        })}
      </div>

      {/* Community Report Detail Modal */}
      {selectedReport && selectedReport.report && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-black rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <Award className="w-6 h-6 text-purple-400" />
                  Community Report Details
                </h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <CommunityReportDetail
                report={selectedReport.report}
                communityReportId={selectedReport.id}
                curatorId={selectedReport.curator_id}
                upvoteCount={selectedReport.upvote_count}
                status={selectedReport.status}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

