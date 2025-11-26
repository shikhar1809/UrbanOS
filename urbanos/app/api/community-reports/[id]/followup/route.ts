import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendEmail, generateCommunityReportEmail } from '@/lib/services/email-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseClient = await createClient();
    const { id } = await params;
    const communityReportId = id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get community report
    const { data: communityReport, error: crError } = await supabaseClient
      .from('community_reports')
      .select('*, report:reports(*)')
      .eq('id', communityReportId)
      .single();

    if (crError || !communityReport) {
      return NextResponse.json({ error: 'Community report not found' }, { status: 404 });
    }

    // Verify user is curator
    if (communityReport.curator_id !== user.id) {
      return NextResponse.json({ error: 'Only curator can send follow-ups' }, { status: 403 });
    }

    const report = communityReport.report as any;

    // Get authorities from report's authority_ids or query based on location
    // For now, query based on location
    const { data: agencies } = await supabaseClient
      .from('agencies')
      .select('email')
      .ilike('region', `%${report.location.address}%`);

    const authorityEmails = agencies?.map((a) => a.email) || [];

    if (authorityEmails.length === 0) {
      return NextResponse.json({ error: 'No authorities found' }, { status: 400 });
    }

    // Get last follow-up number
    const { count: lastFollowupCount } = await supabaseClient
      .from('community_report_followups')
      .select('*', { count: 'exact', head: true })
      .eq('community_report_id', communityReportId);

    const followupNumber = (lastFollowupCount || 0) + 1;

    // Generate follow-up email
    const emailHtml = generateCommunityReportEmail({
      reportTitle: report.title,
      reportDescription: report.description,
      reportType: report.type,
      location: report.location.address,
      upvoteCount: communityReport.upvote_count,
      curatorName: user.email || 'Unknown',
      reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reports/${report.id}`,
    });

    const trackingPixel = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/email/${communityReportId}/${followupNumber}`;

    // Send follow-up email
    const emailResult = await sendEmail({
      to: authorityEmails,
      subject: `Follow-up #${followupNumber}: Community Report - ${report.title}`,
      html: emailHtml,
      trackingPixel,
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error || 'Failed to send follow-up' }, { status: 500 });
    }

      // Create follow-up record
      const { data: followup, error: followupError } = await supabaseClient
        .from('community_report_followups')
        .insert({
          community_report_id: communityReportId,
          followup_number: followupNumber,
          sent_at: new Date().toISOString(),
          response_status: 'pending',
        })
        .select()
        .single();

    if (followupError) throw followupError;

    return NextResponse.json({
      success: true,
      followup: {
        id: followup.id,
        followupNumber: followup.followup_number,
        sentAt: followup.sent_at,
      },
    });
  } catch (error: any) {
    console.error('Error sending follow-up:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseClient = await createClient();
    const { id } = await params;
    const communityReportId = id;

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get follow-ups for this community report
    const { data: followups, error } = await supabaseClient
      .from('community_report_followups')
      .select('*')
      .eq('community_report_id', communityReportId)
      .order('sent_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ followups: followups || [] });
  } catch (error: any) {
    console.error('Error fetching follow-ups:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

