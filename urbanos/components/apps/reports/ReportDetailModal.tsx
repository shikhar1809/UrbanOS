'use client';

import { useState, useEffect } from 'react';
import { X, Building2, Clock, MessageSquare, History, User, Mail, Phone, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Report } from '@/types';
import { supabase } from '@/lib/supabase';
import ReportVoting from './ReportVoting';

interface ReportDetailModalProps {
  report: Report;
  isOpen: boolean;
  onClose: () => void;
  voteCounts?: { upvotes: number; downvotes: number; userVote: 'upvote' | 'downvote' | null };
  upvoters?: Array<{ user_id: string; name?: string; email?: string; signed_at: string }>;
  isCommunityReport?: boolean;
  onVoteChange?: () => void;
}

interface Agency {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  region: string;
}

interface ReportComment {
  id: string;
  comment: string;
  is_agency: boolean;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
  } | null;
}

interface ReportHistory {
  id: string;
  action_type: string;
  description: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  performed_by: string | null;
  agency: {
    name: string;
  } | null;
  performer: {
    full_name: string | null;
    email: string;
  } | null;
}

export default function ReportDetailModal({
  report,
  isOpen,
  onClose,
  voteCounts,
  upvoters = [],
  isCommunityReport = false,
  onVoteChange,
}: ReportDetailModalProps) {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [comments, setComments] = useState<ReportComment[]>([]);
  const [history, setHistory] = useState<ReportHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && report) {
      loadReportDetails();
    }
  }, [isOpen, report?.id]);

  const loadReportDetails = async () => {
    setLoading(true);
    try {
      // Load agency information
      if (report.agency_id) {
        const { data: agencyData } = await supabase
          .from('agencies')
          .select('*')
          .eq('id', report.agency_id)
          .single();
        setAgency(agencyData);
      }

      // Load comments
      const { data: commentsData } = await supabase
        .from('report_comments')
        .select(`
          *,
          users!user_id (
            full_name,
            email
          )
        `)
        .eq('report_id', report.id)
        .order('created_at', { ascending: false });

      setComments((commentsData || []).map((c: any) => ({
        ...c,
        user: Array.isArray(c.users) ? c.users[0] : c.users,
      })));

      // Load history
      const { data: historyData } = await supabase
        .from('report_history')
        .select(`
          *,
          agencies!agency_id (
            name
          ),
          users!performed_by (
            full_name,
            email
          )
        `)
        .eq('report_id', report.id)
        .order('created_at', { ascending: false });

      setHistory((historyData || []).map((h: any) => ({
        ...h,
        agency: Array.isArray(h.agencies) ? h.agencies[0] : h.agencies,
        performer: Array.isArray(h.users) ? h.users[0] : h.users,
      })));

      setHistory(historyData || []);
    } catch (error) {
      console.error('Error loading report details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-black rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">{report.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            <p className="text-gray-300">{report.description}</p>

            {/* Agency Information (Person in Charge) */}
            {agency && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-3">
                  <Building2 className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Assigned Agency</h3>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="font-medium text-white">Name:</span>
                    <span>{agency.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="font-medium text-white">Type:</span>
                    <span>{agency.type}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span>{agency.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{agency.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <span className="font-medium text-white">Region:</span>
                    <span>{agency.region}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Action History / Update Log */}
            {history.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <History className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Action History</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {history.map((item) => (
                    <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-700 last:border-0">
                      <div className="flex-shrink-0 mt-1">
                        {item.action_type === 'status_change' && (
                          <CheckCircle className="w-4 h-4 text-green-400" />
                        )}
                        {item.action_type === 'assignment' && (
                          <Building2 className="w-4 h-4 text-blue-400" />
                        )}
                        {item.action_type === 'priority_change' && (
                          <AlertCircle className="w-4 h-4 text-yellow-400" />
                        )}
                        {item.action_type === 'comment' && (
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                        )}
                        {!['status_change', 'assignment', 'priority_change', 'comment'].includes(item.action_type) && (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{item.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                          {item.performer && (
                            <>
                              <span>•</span>
                              <User className="w-3 h-3" />
                              <span>{item.performer.full_name || item.performer.email}</span>
                            </>
                          )}
                          {item.agency && !item.performer && (
                            <>
                              <span>•</span>
                              <Building2 className="w-3 h-3" />
                              <span>{item.agency.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Comments / Agency Responses */}
            {comments.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Comments & Responses</h3>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {comments.map((comment) => (
                    <div key={comment.id} className="pb-3 border-b border-gray-700 last:border-0">
                      <div className="flex items-start gap-2 mb-1">
                        {comment.is_agency && (
                          <Building2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {comment.user && (
                              <span className="text-sm font-medium text-white">
                                {comment.user.full_name || comment.user.email}
                              </span>
                            )}
                            {comment.is_agency && (
                              <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                                Agency
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {new Date(comment.created_at).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-300">{comment.comment}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {voteCounts && (
              <div className="pt-4 border-t border-gray-700">
                <ReportVoting
                  reportId={report.id}
                  reportTitle={report.title}
                  initialUpvotes={voteCounts.upvotes}
                  initialDownvotes={voteCounts.downvotes}
                  userVote={voteCounts.userVote}
                  showUpvoters={true}
                  upvoters={upvoters}
                  onVoteChange={onVoteChange}
                />
              </div>
            )}

            {report.images && report.images.length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                {report.images.map((image, idx) => (
                  <img key={idx} src={image} alt={`Report ${idx + 1}`} className="rounded-lg" />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

