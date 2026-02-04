'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import { ThumbsUp, ThumbsDown, Users, ChevronUp, ChevronDown } from 'lucide-react';
import { useToast } from '@/lib/toast-context';
import { handleError, logError } from '@/lib/error-handler';
import ESignatureModal from './ESignatureModal';

interface ReportVotingProps {
  reportId: string;
  reportTitle: string;
  initialUpvotes: number;
  initialDownvotes: number;
  userVote?: 'upvote' | 'downvote' | null;
  showUpvoters?: boolean;
  upvoters?: Array<{
    user_id: string;
    name?: string;
    email?: string;
    signed_at: string;
  }>;
  onVoteChange?: () => void;
}

export default function ReportVoting({
  reportId,
  reportTitle,
  initialUpvotes,
  initialDownvotes,
  userVote: initialUserVote,
  showUpvoters = true,
  upvoters = [],
  onVoteChange,
}: ReportVotingProps) {
  const { user } = useAuth();
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [downvotes, setDownvotes] = useState(initialDownvotes);
  const [userVote, setUserVote] = useState<'upvote' | 'downvote' | null>(initialUserVote || null);
  const [loading, setLoading] = useState(false);
  const [showESignatureModal, setShowESignatureModal] = useState(false);
  const [pendingVote, setPendingVote] = useState<'upvote' | 'downvote' | null>(null);
  const { showToast } = useToast();

  // Sync local state with props when they change (e.g., after refresh or parent update)
  useEffect(() => {
    setUpvotes(initialUpvotes);
    setDownvotes(initialDownvotes);
    setUserVote(initialUserVote || null);
  }, [initialUpvotes, initialDownvotes, initialUserVote]);

  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (!user) {
      showToast('Please wait for demo user to load...', 'error');
      return;
    }

    // If already voted the same way, remove vote
    if (userVote === voteType) {
      await removeVote();
      return;
    }

    // If upvoting, show e-signature modal
    if (voteType === 'upvote') {
      setPendingVote('upvote');
      setShowESignatureModal(true);
    } else {
      // Downvote doesn't require signature
      await submitVote(voteType, null);
    }
  };

  const handleESignatureConfirm = async (signatureData: {
    name: string;
    email: string;
    consent: boolean;
    timestamp: string;
    ip: string;
    userAgent: string;
  }) => {
    if (pendingVote) {
      await submitVote(pendingVote, signatureData);
      setPendingVote(null);
    }
  };

  const submitVote = async (
    voteType: 'upvote' | 'downvote',
    signatureData: {
      name: string;
      email: string;
      consent: boolean;
      timestamp: string;
      ip: string;
      userAgent: string;
    } | null
  ) => {
    if (!user) return;

    setLoading(true);
    try {
      // Call API route to handle vote and e-signature
      const response = await fetch(`/api/reports/${reportId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          voteType,
          signatureData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit vote');
      }

      const data = await response.json();

      // Update local state
      setUserVote(voteType);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);

      showToast(
        voteType === 'upvote' ? 'Thank you for your upvote and e-signature!' : 'Vote recorded',
        'success'
      );

      if (onVoteChange) {
        onVoteChange();
      }
    } catch (err: any) {
      logError(err, 'ReportVoting.submitVote');
      const errorInfo = handleError(err);
      showToast(errorInfo.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const removeVote = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/reports/${reportId}/vote`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove vote');
      }

      const data = await response.json();

      setUserVote(null);
      setUpvotes(data.upvotes);
      setDownvotes(data.downvotes);

      showToast('Vote removed', 'success');

      if (onVoteChange) {
        onVoteChange();
      }
    } catch (err: any) {
      logError(err, 'ReportVoting.removeVote');
      const errorInfo = handleError(err);
      showToast(errorInfo.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-4">
        {/* Upvote Button */}
        <button
          onClick={() => handleVote('upvote')}
          disabled={loading || !user}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            userVote === 'upvote'
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={user ? 'Upvote this report' : 'Sign in to vote'}
        >
          <ChevronUp className="w-5 h-5" />
          <span>{upvotes}</span>
        </button>

        {/* Downvote Button */}
        <button
          onClick={() => handleVote('downvote')}
          disabled={loading || !user}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            userVote === 'downvote'
              ? 'bg-red-500 text-white'
              : 'bg-gray-800 hover:bg-gray-700 border border-gray-600 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          title={user ? 'Downvote this report' : 'Sign in to vote'}
        >
          <ChevronDown className="w-5 h-5" />
          <span>{downvotes}</span>
        </button>

        {/* Vote Count Display */}
        <div className="text-sm text-gray-400">
          Net: {upvotes - downvotes > 0 ? '+' : ''}{upvotes - downvotes}
        </div>
      </div>

      {/* Upvoters List (Public visibility) */}
      {showUpvoters && upvoters.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center gap-2 text-sm font-medium mb-2 text-white">
            <Users className="w-4 h-4" />
            <span>Upvoters ({upvoters.length})</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {upvoters.map((upvoter, index) => (
              <div
                key={upvoter.user_id || index}
                className="text-xs bg-gray-800 text-gray-200 px-2 py-1 rounded border border-gray-700"
                title={`Signed on ${new Date(upvoter.signed_at).toLocaleDateString()}`}
              >
                {upvoter.name || upvoter.email || 'Anonymous'}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E-Signature Modal */}
      <ESignatureModal
        isOpen={showESignatureModal}
        onClose={() => {
          setShowESignatureModal(false);
          setPendingVote(null);
        }}
        onConfirm={handleESignatureConfirm}
        reportTitle={reportTitle}
      />
    </>
  );
}

