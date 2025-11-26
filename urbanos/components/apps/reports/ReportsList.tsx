'use client';

import { useState, useEffect } from 'react';
import { Report } from '@/types';
import { AlertTriangle, Clock, CheckCircle, XCircle, Calendar, Users, Award, Sparkles, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { useOS } from '@/lib/os-context';
import { useToast } from '@/lib/toast-context';
import ReportVoting from './ReportVoting';
import dynamic from 'next/dynamic';

const ReportDetailModal = dynamic(() => import('./ReportDetailModal'), { ssr: false });

interface ReportsListProps {
  reports: Report[];
  showFilter?: 'all' | 'my' | 'community';
}

interface VoteCounts {
  upvotes: number;
  downvotes: number;
  userVote: 'upvote' | 'downvote' | null;
}

interface Upvoter {
  user_id: string;
  name?: string;
  email?: string;
  signed_at: string;
}

export default function ReportsList({ reports, showFilter = 'all' }: ReportsListProps) {
  const { user } = useAuth();
  const { zoomToReport } = useOS();
  const { showToast } = useToast();
  const [voteCounts, setVoteCounts] = useState<Record<string, VoteCounts>>({});
  const [upvoters, setUpvoters] = useState<Record<string, Upvoter[]>>({});
  const [communityReports, setCommunityReports] = useState<Set<string>>(new Set());
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [promotingReportId, setPromotingReportId] = useState<string | null>(null);

  // Load vote counts and community report status
  useEffect(() => {
    if (reports.length === 0) return;

    const loadVoteData = async () => {
      // Wait a bit for auth to be ready if user is null
      if (!user) {
        // Still load votes even if not authenticated (for public viewing)
        // RLS will handle permissions
      }

      for (const report of reports) {
        await loadVotesForReport(report.id);
        await checkCommunityReport(report.id);
      }
    };

    loadVoteData();
  }, [reports, user]);

  const loadVotesForReport = async (reportId: string) => {
    try {
      // Check if we have a session (for debugging)
      const { data: { session } } = await supabase.auth.getSession();
      console.log(`Loading votes for report ${reportId}, session:`, session ? 'authenticated' : 'not authenticated');

      // Get all votes for this report and count them client-side
      // This is more reliable than using count with head:true
      const { data: allVotes, error: allVotesError } = await supabase
        .from('report_votes')
        .select('vote_type, user_id')
        .eq('report_id', reportId);

      console.log(`Query result for report ${reportId}:`, {
        hasError: !!allVotesError,
        error: allVotesError ? {
          code: allVotesError.code,
          message: allVotesError.message,
          details: allVotesError.details,
          hint: allVotesError.hint,
        } : null,
        dataLength: allVotes?.length || 0,
        data: JSON.stringify(allVotes || []),
      });

      if (allVotesError) {
        console.error('Error loading votes:', {
          code: allVotesError.code,
          message: allVotesError.message,
          details: allVotesError.details,
          hint: allVotesError.hint,
          reportId,
        });
        // Set defaults on error
        setVoteCounts((prev) => ({
          ...prev,
          [reportId]: {
            upvotes: 0,
            downvotes: 0,
            userVote: null,
          },
        }));
        return;
      }

      // Count votes client-side
      let upvoteCount = allVotes?.filter((v) => v.vote_type === 'upvote').length || 0;
      const downvoteCount = allVotes?.filter((v) => v.vote_type === 'downvote').length || 0;

      // Check if this is a community report and use its upvote_count if available
      const { data: communityReport } = await supabase
        .from('community_reports')
        .select('upvote_count')
        .eq('report_id', reportId)
        .single();

      // If community report exists, use its upvote_count (which is the accurate count)
      if (communityReport && communityReport.upvote_count > upvoteCount) {
        upvoteCount = communityReport.upvote_count;
      } else {
        // For non-community reports, check if we have demo upvote counts stored
        // Get the report to check its title
        const { data: reportData } = await supabase
          .from('reports')
          .select('title')
          .eq('id', reportId)
          .single();

        if (reportData) {
          // Demo upvote counts for specific reports (non-community reports)
          const demoUpvoteCounts: Record<string, number> = {
            'Streetlights not working on Vikramaditya Marg': 45,
            'Dead dog on main road in Indira Nagar Sector 14': 38,
            'Flickering streetlight near Hazratganj metro station': 25,
            'Garbage dump near residential complex in Gomti Nagar': 15,
            'Dead cow on Lucknow-Kanpur highway': 8,
            'Pothole on Rana Pratap Marg - RESOLVED': 3,
          };

          if (demoUpvoteCounts[reportData.title] && demoUpvoteCounts[reportData.title] > upvoteCount) {
            upvoteCount = demoUpvoteCounts[reportData.title];
          }
        }
      }

      // Get user's vote from the allVotes array
      let userVote: 'upvote' | 'downvote' | null = null;
      if (user && allVotes) {
        const userVoteData = allVotes.find((v) => v.user_id === user.id);
        if (userVoteData) {
          userVote = userVoteData.vote_type as 'upvote' | 'downvote';
        }
      }

      console.log(`Votes for report ${reportId}:`, {
        total: allVotes?.length || 0,
        upvotes: upvoteCount,
        downvotes: downvoteCount,
        userVote,
        userId: user?.id,
        communityReportUpvotes: communityReport?.upvote_count,
        allVotes: JSON.stringify(allVotes || []),
      });

      // Get upvoters with e-signatures
      const { data: upvoterData } = await supabase
        .from('e_signatures')
        .select(`
          user_id,
          signed_at,
          signature_data,
          users:user_id (email, full_name)
        `)
        .eq('report_id', reportId);

      const upvotersList: Upvoter[] =
        upvoterData?.map((sig: any) => ({
          user_id: sig.user_id,
          name: sig.users?.full_name || sig.signature_data?.name,
          email: sig.users?.email || sig.signature_data?.email,
          signed_at: sig.signed_at,
        })) || [];

      setVoteCounts((prev) => ({
        ...prev,
        [reportId]: {
          upvotes: upvoteCount,
          downvotes: downvoteCount,
          userVote,
        },
      }));

      setUpvoters((prev) => ({
        ...prev,
        [reportId]: upvotersList,
      }));
    } catch (error) {
      console.error('Error loading votes:', error);
    }
  };

  const checkCommunityReport = async (reportId: string) => {
    try {
      const { data } = await supabase
        .from('community_reports')
        .select('id')
        .eq('report_id', reportId)
        .single();

      if (data) {
        setCommunityReports((prev) => new Set([...prev, reportId]));
      }
    } catch (error) {
      // Not a community report, ignore
    }
  };

  const handleVoteChange = (reportId: string) => {
    loadVotesForReport(reportId);
    checkCommunityReport(reportId);
  };

  const handlePromoteToCommunityReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening report detail modal
    
    if (!user) {
      showToast('Please sign in to promote reports', 'error');
      return;
    }

    setPromotingReportId(reportId);
    try {
      const response = await fetch('/api/community-reports/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to promote report');
      }

      showToast('Report promoted to community report! You can now use curator tools.', 'success');
      
      // Refresh community report status
      await checkCommunityReport(reportId);
      
      // Reload votes to get updated count
      await loadVotesForReport(reportId);
    } catch (error: any) {
      console.error('Error promoting report:', error);
      showToast(error.message || 'Failed to promote report', 'error');
    } finally {
      setPromotingReportId(null);
    }
  };

  if (reports.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-foreground/20 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No Reports Yet</h3>
          <p className="text-foreground/70">
            Create your first report to track civic issues in your community.
          </p>
        </div>
      </div>
    );
  }

  const statusColors = {
    submitted: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    received: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
    'in-progress': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    resolved: 'bg-green-500/10 text-green-500 border-green-500/20',
    rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
  };

  const statusIcons = {
    submitted: Clock,
    received: AlertTriangle,
    'in-progress': AlertTriangle,
    resolved: CheckCircle,
    rejected: XCircle,
  };

  return (
    <>
      <div className="p-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {reports.map((report, index) => {
            const StatusIcon = statusIcons[report.status];
            const submittedDate = new Date(report.submitted_at).toLocaleDateString();
            const submittedTime = new Date(report.submitted_at).toLocaleTimeString();
            const votes = voteCounts[report.id] || { upvotes: 0, downvotes: 0, userVote: null };
            const isCommunityReport = communityReports.has(report.id);
            const isMyReport = user && report.user_id === user.id;

            return (
              <motion.div
                key={report.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`rounded-xl p-6 transition-all cursor-pointer ${
                  isCommunityReport
                    ? 'bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-blue-500/10 border-2 border-purple-500/30 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 hover:border-purple-500/50'
                    : isMyReport
                    ? 'bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-cyan-500/10 border-2 border-blue-500/40 shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:border-blue-500/60 ring-2 ring-blue-500/30'
                    : 'bg-foreground/5 hover:bg-foreground/10 border border-foreground/10'
                }`}
                onClick={() => {
                  setSelectedReport(report);
                  // Zoom to report location on map
                  if (report.location && typeof report.location === 'object' && 'lat' in report.location && 'lng' in report.location) {
                    zoomToReport(report.location.lat, report.location.lng);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      {isCommunityReport && (
                        <Award className="w-5 h-5 text-purple-400 animate-pulse" />
                      )}
                      {isMyReport && !isCommunityReport && (
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-500 text-white border-2 border-blue-600">
                          MY REPORT
                        </span>
                      )}
                      <h4 className={`text-lg font-semibold ${isCommunityReport ? 'text-white' : isMyReport ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                        {report.title}
                      </h4>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          isCommunityReport 
                            ? 'bg-white/20 text-white border-white/30'
                            : statusColors[report.status]
                        }`}
                      >
                        <StatusIcon className="w-3 h-3 inline mr-1" />
                        {report.status.replace('-', ' ')}
                      </span>
                      {isCommunityReport && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white border-2 border-white/30 flex items-center gap-1 shadow-lg">
                          <Award className="w-3 h-3" />
                          Community Report
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-2 line-clamp-2 ${isCommunityReport ? 'text-white/90' : 'text-foreground/70'}`}>
                      {report.description}
                    </p>
                    <div className={`flex items-center gap-4 text-xs flex-wrap ${isCommunityReport ? 'text-white/70' : 'text-foreground/50'}`}>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {submittedDate} at {submittedTime}
                      </span>
                      {!report.is_anonymous && report.creator && (
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
                      <span className="capitalize">{report.type.replace('_', ' ')}</span>
                      <span className="truncate max-w-xs">{report.location.address}</span>
                    </div>
                  </div>
                </div>

                {/* Promote Button for My Reports */}
                {isMyReport && !isCommunityReport && user && (
                  <div className="mt-3 mb-3" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={(e) => handlePromoteToCommunityReport(report.id, e)}
                      disabled={promotingReportId === report.id}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg border-2 border-white/30"
                    >
                      {promotingReportId === report.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Promoting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Promote to Community Report
                        </>
                      )}
                    </button>
                    <p className="text-xs text-foreground/50 mt-1">
                      Promote this report to test curator tools (normally requires 50+ upvotes)
                    </p>
                  </div>
                )}

                {/* Voting Section */}
                <div className={`mt-4 pt-4 ${isCommunityReport ? 'border-t border-white/20' : 'border-t border-foreground/10'}`} onClick={(e) => e.stopPropagation()}>
                  <ReportVoting
                    reportId={report.id}
                    reportTitle={report.title}
                    initialUpvotes={votes.upvotes}
                    initialDownvotes={votes.downvotes}
                    userVote={votes.userVote}
                    showUpvoters={false}
                    upvoters={upvoters[report.id] || []}
                    onVoteChange={() => handleVoteChange(report.id)}
                  />
                </div>

                {/* Images Preview */}
                {report.images && report.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-4">
                    {report.images.slice(0, 4).map((image, idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg overflow-hidden bg-foreground/10"
                      >
                        <img
                          src={image}
                          alt={`Report image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Response Time */}
                {report.response_time_hours && (
                  <div className="mt-4 pt-4 border-t border-foreground/10">
                    <p className="text-sm text-foreground/70">
                      Resolved in {Math.round(report.response_time_hours)} hours
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Report Detail Modal */}
      {selectedReport && (
        <ReportDetailModal
          report={selectedReport}
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          voteCounts={voteCounts[selectedReport.id]}
          upvoters={upvoters[selectedReport.id] || []}
          isCommunityReport={communityReports.has(selectedReport.id)}
          onVoteChange={() => handleVoteChange(selectedReport.id)}
        />
      )}
    </>
  );
}
