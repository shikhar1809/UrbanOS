import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const reportId = id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { voteType, signatureData } = body;

    if (!voteType || !['upvote', 'downvote'].includes(voteType)) {
      return NextResponse.json({ error: 'Invalid vote type' }, { status: 400 });
    }

    // Check if user has already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('report_votes')
      .select('*')
      .eq('report_id', reportId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing vote:', checkError);
      throw checkError;
    }

    // If already voted differently, update the vote
    if (existingVote) {
      // Update existing vote
      const { error: updateError } = await supabase
        .from('report_votes')
        .update({ vote_type: voteType, updated_at: new Date().toISOString() })
        .eq('report_id', reportId)
        .eq('user_id', user.id);

      if (updateError) {
        console.error('Error updating vote:', updateError);
        throw updateError;
      }

      // If changing to upvote, create/update e-signature
      if (voteType === 'upvote' && signatureData) {
        await supabase.from('e_signatures').upsert({
          report_id: reportId,
          user_id: user.id,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          ip_address: signatureData.ip || null,
          user_agent: signatureData.userAgent || null,
        });
      }

      // If changing from upvote to downvote, remove e-signature
      if (existingVote.vote_type === 'upvote' && voteType === 'downvote') {
        await supabase
          .from('e_signatures')
          .delete()
          .eq('report_id', reportId)
          .eq('user_id', user.id);
      }
    } else {
      // Create new vote
      const { data: insertedVote, error: insertError } = await supabase
        .from('report_votes')
        .insert({
          report_id: reportId,
          user_id: user.id,
          vote_type: voteType,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting vote:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          reportId,
          userId: user.id,
        });
        throw insertError;
      }

      // Verify vote was saved
      if (!insertedVote) {
        console.error('Vote insert returned no data');
        throw new Error('Failed to save vote - no data returned');
      }

      console.log('Vote saved successfully:', insertedVote);

      // If upvote, create e-signature
      if (voteType === 'upvote' && signatureData) {
        const { error: sigError } = await supabase.from('e_signatures').insert({
          report_id: reportId,
          user_id: user.id,
          signature_data: signatureData,
          signed_at: new Date().toISOString(),
          ip_address: signatureData.ip || null,
          user_agent: signatureData.userAgent || null,
        });

        if (sigError) {
          console.error('Error inserting e-signature:', sigError);
          // Don't throw - vote is already saved, signature is secondary
        }
      }
    }

    // Get updated vote counts - fetch all votes and count them (more reliable)
    const { data: allVotes, error: votesError } = await supabase
      .from('report_votes')
      .select('vote_type')
      .eq('report_id', reportId);

    if (votesError) {
      console.error('Error loading votes for count:', votesError);
      // Fallback to 0 if query fails
      return NextResponse.json({
        success: true,
        upvotes: 0,
        downvotes: 0,
        userVote: voteType,
      });
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

    console.log('Vote counts after save:', {
      reportId,
      totalVotes: allVotes?.length || 0,
      upvotes: upvoteCount,
      downvotes: downvoteCount,
      communityReportUpvotes: communityReport?.upvote_count,
    });

    // The trigger will automatically promote to community report if >= 50 upvotes
    // But we can also check here and return status

    return NextResponse.json({
      success: true,
      upvotes: upvoteCount,
      downvotes: downvoteCount,
      userVote: voteType,
    });
  } catch (error: any) {
    console.error('Error in vote API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const reportId = id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Remove vote
    const { error: deleteError } = await supabase
      .from('report_votes')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', user.id);

    if (deleteError) throw deleteError;

    // Remove e-signature if exists
    await supabase
      .from('e_signatures')
      .delete()
      .eq('report_id', reportId)
      .eq('user_id', user.id);

    // Get updated vote counts - fetch all votes and count them (more reliable)
    const { data: allVotes, error: votesError } = await supabase
      .from('report_votes')
      .select('vote_type')
      .eq('report_id', reportId);

    if (votesError) {
      console.error('Error loading votes for count:', votesError);
      return NextResponse.json({
        success: true,
        upvotes: 0,
        downvotes: 0,
        userVote: null,
      });
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

    return NextResponse.json({
      success: true,
      upvotes: upvoteCount,
      downvotes: downvoteCount,
      userVote: null,
    });
  } catch (error: any) {
    console.error('Error in vote delete API:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

