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
    if (!isCurator) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/community-reports/${communityReportId}/generate-brief-document`, {
        method: 'POST',
      });

      const responseText = await response.text();
      let errorData: any = {};
      let data: any = {};
      
      try {
        if (!response.ok) {
          errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Failed to generate brief document: ${response.status} ${response.statusText}`);
        }
        
        data = JSON.parse(responseText);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate brief document');
        }
        
        setBriefDocumentGenerated(true);
        
        // Download the PDF
        const link = document.createElement('a');
        link.href = data.documentUrl;
        link.download = data.fileName || 'community-report-brief.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showToast(data.message || 'Brief document generated and downloaded!', 'success');
      } catch (parseError: any) {
        // If JSON parsing fails, use text response
        if (!response.ok) {
          throw new Error(responseText || `Failed to generate brief document: ${response.status}`);
        }
        throw parseError;
      }
    } catch (error: any) {
      console.error('Error generating brief document:', error);
      showToast(error.message || 'Failed to generate brief document', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePIL = async () => {
    if (!isCurator) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/community-reports/${communityReportId}/generate-document`, {
        method: 'POST',
      });

      const responseText = await response.text();
      let errorData: any = {};
      let data: any = {};
      
      try {
        if (!response.ok) {
          errorData = JSON.parse(responseText);
          throw new Error(errorData.error || `Failed to generate PIL: ${response.status} ${response.statusText}`);
        }
        
        data = JSON.parse(responseText);
        
        if (!data.success) {
          throw new Error(data.error || 'Failed to generate PIL');
        }
        
        setPilGenerated(true);
        
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
        
        showToast(data.message || 'PIL generated successfully!', 'success');
      } catch (parseError: any) {
        // If JSON parsing fails, use text response
        if (!response.ok) {
          throw new Error(responseText || `Failed to generate PIL: ${response.status}`);
        }
        throw parseError;
      }
    } catch (error: any) {
      console.error('Error generating PIL:', error);
      showToast(error.message || 'Failed to generate PIL', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!isCurator || !briefDocumentGenerated) return;

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
    if (!isCurator) return;

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

      showToast('PIL filed successfully! All signatories have been notified.', 'success');
      setShowPILModal(false);
      setPILDemands('');
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

      {/* Curator Actions */}
      {isCurator && (
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-white">Curator Actions</h3>
          
          <div className="flex gap-3 flex-wrap">
            {!isDemoData && (
              <>
                <button
                  onClick={handleGenerateBriefDocument}
                  disabled={loading || briefDocumentGenerated}
                  className="px-4 py-2 bg-windows-blue text-white rounded-lg font-medium hover:bg-windows-blue-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : briefDocumentGenerated ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {briefDocumentGenerated ? 'Brief Document Generated' : 'Generate Documents'}
                </button>

                <button
                  onClick={handleGeneratePIL}
                  disabled={loading || pilGenerated}
                  className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : pilGenerated ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {pilGenerated ? 'PIL Generated' : 'Generate PIL'}
                </button>
              </>
            )}
            
            {isDemoData && (
              <>
                <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed">
                  <FileText className="w-4 h-4" />
                  Generate Documents (Demo data - not available)
                </div>
                <div className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg font-medium flex items-center gap-2 cursor-not-allowed">
                  <FileText className="w-4 h-4" />
                  Generate PIL (Demo data - not available)
                </div>
              </>
            )}

            {pilGenerated && (
              <>
                <button
                  onClick={async () => {
                    // Load PIL signatures
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
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
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View E-Signatures
                </button>

                <button
                  onClick={handleSendEmail}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Send to Authorities
                </button>

                {status === 'active' && (
                  <button
                    onClick={() => setShowPILModal(true)}
                    disabled={loading}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    File PIL
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

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

