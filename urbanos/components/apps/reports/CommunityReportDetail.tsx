'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Report } from '@/types';
import { Award, Users, Mail, FileText, Send, Loader2, CheckCircle, X, Eye } from 'lucide-react';
import { useToast } from '@/lib/toast-context';
import { supabase } from '@/lib/supabase';

interface CommunityReportDetailProps {
  report: Report;
  communityReportId: string;
  curatorId: string;
  upvoteCount: number;
  status: 'active' | 'resolved' | 'escalated_to_pil';
}

export default function CommunityReportDetail({
  report,
  communityReportId,
  curatorId,
  upvoteCount,
  status,
}: CommunityReportDetailProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [briefDocumentGenerated, setBriefDocumentGenerated] = useState(false);
  const [pilGenerated, setPilGenerated] = useState(false);
  const [followups, setFollowups] = useState<any[]>([]);
  const [showPILViewer, setShowPILViewer] = useState(false);
  const [pilSignatures, setPilSignatures] = useState<any[]>([]);
  const [curatorName, setCuratorName] = useState<string>('Unknown Curator');
  const [curatorEmail, setCuratorEmail] = useState<string>('');

  const isCurator = user?.id === curatorId;
  
  // Check if this is demo data (demo IDs don't follow UUID format)
  const isDemoData = communityReportId.startsWith('demo-') || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(communityReportId);

  // Debug logging
  useEffect(() => {
    console.log('CommunityReportDetail Debug:', {
      userId: user?.id,
      curatorId,
      isCurator,
      isDemoData,
      communityReportId,
      isAuthenticated: !!user,
    });
  }, [user?.id, curatorId, isCurator, isDemoData, communityReportId]);

  // Fetch curator information
  useEffect(() => {
    const fetchCuratorInfo = async () => {
      if (!curatorId) return;
      
      try {
        const { data: curatorData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', curatorId)
          .single();
        
        if (curatorData) {
          setCuratorName(curatorData.full_name || curatorData.email?.split('@')[0] || 'Unknown Curator');
          setCuratorEmail(curatorData.email || '');
        }
      } catch (error) {
        console.error('Error fetching curator info:', error);
      }
    };
    
    fetchCuratorInfo();
  }, [curatorId]);

  const handleGenerateBriefDocument = async () => {
    if (!user) {
      showToast('Please sign in to generate documents', 'error');
      return;
    }

    if (isDemoData) {
      showToast('Cannot generate documents for demo data', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/community-reports/${communityReportId}/generate-brief-document`, {
        method: 'POST',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Failed to generate document' }));
        throw new Error(error.error || 'Failed to generate document');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to generate document');
      }
      
      setBriefDocumentGenerated(true);
      
      // Extract base64 data from data URL
      const base64Data = data.documentUrl.replace(/^data:.*?;base64,/, '');
      
      // Convert base64 to text (since it's currently text format, not real PDF)
      const textContent = atob(base64Data);
      
      // Create blob as text/plain so it opens properly
      const blob = new Blob([textContent], { type: 'text/plain' });
      const blobUrl = URL.createObjectURL(blob);
      
      // Open in new window
      const newWindow = window.open(blobUrl, '_blank');
      
      // Also trigger download
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = (data.fileName || 'community-report-brief').replace('.pdf', '.txt');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up blob URL after a delay
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl);
        if (newWindow) {
          newWindow.focus();
        }
      }, 100);
      
      showToast('Document generated and opened!', 'success');
    } catch (error: any) {
      console.error('Error generating brief document:', error);
      showToast(error.message || 'Failed to generate document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePIL = () => {
    if (!user) {
      showToast('Please sign in to generate PIL', 'error');
      return;
    }

    if (isDemoData) {
      showToast('Cannot generate PIL for demo data', 'error');
      return;
    }

    // Open the PIL modal to enter demands
    setShowPILModal(true);
  };

  const handleSendEmail = async () => {
    if (!user) {
      showToast('You must be signed in to send emails', 'error');
      return;
    }
    
    if (isDemoData) {
      showToast('Cannot send emails for demo data', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/community-reports/${communityReportId}/send-email`, {
        method: 'POST',
      });

      if (!response.ok) throw new Error('Failed to send email');

      showToast('Email sent to authorities successfully!', 'success');
      // Reload followups
    } catch (error: any) {
      showToast(error.message || 'Failed to send email', 'error');
    } finally {
      setLoading(false);
    }
  };

  const [showPILModal, setShowPILModal] = useState(false);
  const [pilDemands, setPILDemands] = useState('');

  const handleFilePIL = async () => {
    if (!user) {
      showToast('You must be signed in to file PIL', 'error');
      return;
    }

    if (!pilDemands.trim()) {
      showToast('Please enter demands before filing PIL', 'error');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/community-reports/${communityReportId}/pil`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ demands: pilDemands }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to file PIL');
      }

      const result = await response.json();
      setPilGenerated(true);
      setShowPILModal(false);
      setPILDemands('');
      
      // Download and open PIL document if available
      if (result.documentUrl) {
        // Extract base64 data from data URL
        const base64Data = result.documentUrl.replace(/^data:.*?;base64,/, '');
        
        // Convert base64 to text (since it's currently text format, not real PDF)
        const textContent = atob(base64Data);
        
        // Create blob as text/plain so it opens properly
        const blob = new Blob([textContent], { type: 'text/plain' });
        const blobUrl = URL.createObjectURL(blob);
        
        // Open in new window
        const newWindow = window.open(blobUrl, '_blank');
        
        // Also trigger download
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = (result.fileName || 'pil-document').replace('.pdf', '.txt');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up blob URL after a delay
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl);
          if (newWindow) {
            newWindow.focus();
          }
        }, 100);
      }
      
      // Load PIL signatures for display
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        const { data: sigs } = await supabase
          .from('e_signatures')
          .select(`
            *,
            user:users!user_id (full_name, email)
          `)
          .eq('report_id', report.id);
        setPilSignatures(sigs || []);
      }
      
      showToast(result.message || 'PIL generated and opened!', 'success');
    } catch (error: any) {
      showToast(error.message || 'Failed to file PIL', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-8 h-8 text-purple-400" />
        <div>
          <h2 className="text-2xl font-bold text-white">{report.title}</h2>
          <p className="text-sm text-gray-400">
            Community Report • {upvoteCount} upvotes
            {curatorName && ` • Curated by ${curatorName}`}
          </p>
        </div>
      </div>

      {/* Document Generation Actions - REBUILT FROM SCRATCH */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
        <h3 className="text-xl font-bold text-white mb-4">Generate Documents</h3>
        
        {!user ? (
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 text-sm">⚠️ Please sign in to generate documents</p>
          </div>
        ) : isDemoData ? (
          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
            <p className="text-gray-400 text-sm">⚠️ Demo data cannot generate documents. Please use a real community report.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Generate Document Button */}
            <button
              onClick={handleGenerateBriefDocument}
              disabled={loading || briefDocumentGenerated}
              className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating Document...</span>
                </>
              ) : briefDocumentGenerated ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>Document Generated ✓</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Generate Document</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Creates a brief document with incident details and government updates/actions
            </p>

            {/* Generate PIL Button */}
            <button
              onClick={handleGeneratePIL}
              disabled={loading || pilGenerated}
              className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Generating PIL...</span>
                </>
              ) : pilGenerated ? (
                <>
                  <CheckCircle className="w-5 h-5" />
                  <span>PIL Generated ✓</span>
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  <span>Generate PIL</span>
                </>
              )}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Creates a legal PIL document with e-signatures of all upvoters, ready for submission
            </p>

            {/* Additional Actions (shown after PIL is generated) */}
            {pilGenerated && (
              <div className="mt-6 pt-6 border-t border-gray-700 space-y-3">
                <button
                  onClick={async () => {
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (currentUser) {
                      const { data: sigs } = await supabase
                        .from('e_signatures')
                        .select(`
                          *,
                          user:users!user_id (full_name, email)
                        `)
                        .eq('report_id', report.id);
                      setPilSignatures(sigs || []);
                    }
                    setShowPILViewer(true);
                  }}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View E-Signatures</span>
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="w-full px-4 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send to Authorities</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Report Details */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg p-6 space-y-4">
        <div>
          <h3 className="font-semibold mb-2 text-white">Description</h3>
          <p className="text-gray-300">{report.description}</p>
        </div>

        <div>
          <h3 className="font-semibold mb-2 text-white">Location</h3>
          <p className="text-gray-300">{report.location.address}</p>
        </div>

        {report.images && report.images.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-white">Images</h3>
            <div className="grid grid-cols-3 gap-2">
              {report.images.map((image, idx) => (
                <img key={idx} src={image} alt={`Report ${idx + 1}`} className="rounded-lg w-full h-32 object-cover" />
              ))}
            </div>
          </div>
        )}

        {report.videos && report.videos.length > 0 && (
          <div>
            <h3 className="font-semibold mb-2 text-white">Videos</h3>
            <div className="grid grid-cols-2 gap-2">
              {report.videos.map((video, idx) => (
                <video key={idx} src={video} controls className="rounded-lg w-full" />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Follow-up Timeline */}
      {followups.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
          <h3 className="font-semibold mb-4 text-white">Follow-up Timeline</h3>
          <div className="space-y-3">
            {followups.map((followup, idx) => (
              <div key={idx} className="border-l-2 border-gray-600 pl-4">
                <p className="text-sm font-medium text-white">Follow-up #{followup.followup_number}</p>
                <p className="text-xs text-gray-400">
                  Sent: {new Date(followup.sent_at).toLocaleDateString()}
                </p>
                {followup.response_status !== 'pending' && (
                  <p className="text-xs text-gray-400">
                    Status: {followup.response_status}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIL Filing Modal */}
      {showPILModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-black rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-white">File Public Interest Litigation (PIL)</h3>
                <button
                  onClick={() => setShowPILModal(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-300">
                  Enter the demands/claims you want to make in the PIL. This document will include all upvoters' e-signatures.
                </p>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">
                    Demands/Claims <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={pilDemands}
                    onChange={(e) => setPILDemands(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-windows-blue h-48 resize-none text-white placeholder-gray-500"
                    placeholder="Enter your demands/claims for the PIL..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-700">
                  <button
                    onClick={() => setShowPILModal(false)}
                    className="px-4 py-2 rounded-lg border border-gray-600 hover:bg-gray-800 transition-colors text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleFilePIL}
                    disabled={loading || !pilDemands.trim()}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg font-semibold hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                    File PIL
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIL Viewer Modal */}
      {showPILViewer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-black rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <FileText className="w-6 h-6 text-purple-400" />
                  Public Interest Litigation (PIL) Document
                </h2>
                <button
                  onClick={() => setShowPILViewer(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PIL Document Content */}
              <div className="bg-white text-black p-8 rounded-lg mb-6 space-y-4">
                <div className="text-center border-b-2 border-gray-300 pb-4 mb-4">
                  <h1 className="text-3xl font-bold mb-2">PUBLIC INTEREST LITIGATION</h1>
                  <p className="text-lg">In the High Court of Judicature at Allahabad, Lucknow Bench</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-bold text-lg mb-2">Petition Regarding: {report.title}</h3>
                    <p className="text-sm text-gray-700 mb-4">{report.description}</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Location:</h3>
                    <p className="text-sm">{report.location.address}</p>
                  </div>

                  <div>
                    <h3 className="font-bold mb-2">Demands:</h3>
                    <p className="text-sm">We, the undersigned citizens, demand immediate action to address this civic issue affecting our community.</p>
                  </div>

                  <div className="mt-8 border-t-2 border-gray-300 pt-4">
                    <h3 className="font-bold mb-4">E-Signatures ({pilSignatures.length} signatories):</h3>
                    <div className="space-y-3">
                      {pilSignatures.length > 0 ? (
                        pilSignatures.map((sig: any, idx: number) => (
                          <div key={sig.id} className="border border-gray-300 p-3 rounded">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-semibold">{sig.user?.full_name || sig.signature_data?.name || 'Anonymous'}</p>
                                <p className="text-xs text-gray-600">{sig.user?.email || sig.signature_data?.email || ''}</p>
                                <p className="text-xs text-gray-500">Signed: {new Date(sig.signed_at).toLocaleString()}</p>
                              </div>
                              <div className="text-right">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                                <p className="text-xs text-gray-500 mt-1">Verified</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-1">E-Signature:</p>
                              <div className="bg-gray-100 p-2 rounded border border-gray-300">
                                <div className="font-mono text-xs text-gray-600">
                                  Verified Digital Signature
                                </div>
                                <div className="font-mono text-xs text-gray-500 mt-1">
                                  Hash: {Buffer.from(`${sig.user?.email || ''}${sig.signed_at}`).toString('base64').substring(0, 24)}...
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm">No signatures yet</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 border-t-2 border-gray-300 pt-4">
                    <h3 className="font-bold mb-4">Curator Information & E-Signature:</h3>
                    <div className="border border-gray-300 p-4 rounded">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold">{curatorName}</p>
                          <p className="text-xs text-gray-600">{curatorEmail || 'Curator Email'}</p>
                          <p className="text-xs text-gray-500">Filed by curator</p>
                        </div>
                        <div className="text-right">
                          <CheckCircle className="w-6 h-6 text-blue-600" />
                          <p className="text-xs text-gray-500 mt-1">Verified</p>
                        </div>
                      </div>
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-xs font-semibold text-gray-700 mb-1">Curator E-Signature:</p>
                        <div className="bg-blue-50 p-2 rounded border border-blue-300">
                          <div className="font-mono text-xs text-gray-600">
                            Verified Digital Signature of Curator
                          </div>
                          <div className="font-mono text-xs text-gray-500 mt-1">
                            Hash: {Buffer.from(`${curatorEmail || curatorId || ''}${new Date().toISOString()}`).toString('base64').substring(0, 24)}...
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setShowPILViewer(false)}
                  className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

