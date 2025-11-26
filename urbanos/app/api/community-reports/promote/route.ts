import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Manually promote a report to community report for testing purposes
 * This allows curators to test curator tools without needing 50+ upvotes
 */
export async function POST(request: NextRequest) {
  try {
    const supabaseClient = await createClient();
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { reportId } = body;

    if (!reportId) {
      return NextResponse.json({ error: 'Report ID is required' }, { status: 400 });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reportId)) {
      return NextResponse.json({ error: 'Invalid report ID format' }, { status: 400 });
    }

    // Check if report exists and user owns it
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('id, user_id, title')
      .eq('id', reportId)
      .single();

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Check if user owns the report
    if (report.user_id !== user.id) {
      return NextResponse.json({ error: 'You can only promote your own reports' }, { status: 403 });
    }

    // Check if community report already exists
    const { data: existingCR } = await supabaseClient
      .from('community_reports')
      .select('id')
      .eq('report_id', reportId)
      .single();

    if (existingCR) {
      return NextResponse.json({ 
        error: 'Report is already a community report',
        communityReportId: existingCR.id
      }, { status: 400 });
    }

    // Count current upvotes
    const { count: upvoteCount } = await supabaseClient
      .from('report_votes')
      .select('*', { count: 'exact', head: true })
      .eq('report_id', reportId)
      .eq('vote_type', 'upvote');

    // Create community report entry
    const { data: communityReport, error: crError } = await supabaseClient
      .from('community_reports')
      .insert({
        report_id: reportId,
        curator_id: user.id, // User becomes the curator
        upvote_count: upvoteCount || 0,
        status: 'active',
        promoted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (crError) {
      console.error('Error creating community report:', crError);
      return NextResponse.json({ 
        error: 'Failed to promote report',
        details: process.env.NODE_ENV === 'development' ? crError.message : undefined
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Report promoted to community report successfully!',
      communityReport: {
        id: communityReport.id,
        reportId: communityReport.report_id,
        curatorId: communityReport.curator_id,
        upvoteCount: communityReport.upvote_count,
        status: communityReport.status,
      },
    });
  } catch (error: any) {
    console.error('Error promoting report:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

