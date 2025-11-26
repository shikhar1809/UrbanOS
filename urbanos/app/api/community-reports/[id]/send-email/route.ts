import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { sendEmail, generateCommunityReportEmail } from '@/lib/services/email-service';
import { getAuthoritiesByTypeAndLocation } from '@/lib/services/authority-tagger';

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
      return NextResponse.json({ error: 'Only curator can send emails' }, { status: 403 });
    }

    const report = communityReport.report as any;

    // Get authorities for this report (location-based)
    const authorities = await getAuthoritiesByTypeAndLocation(
      report.type,
      report.location
    );

    if (authorities.length === 0) {
      return NextResponse.json({ error: 'No authorities found for this location' }, { status: 400 });
    }

    // Get document URL (should be generated first - check if exists)
    // Note: Document should be generated via generate-document endpoint first

    // Generate email HTML
    const emailHtml = generateCommunityReportEmail({
      reportTitle: report.title,
      reportDescription: report.description,
      reportType: report.type,
      location: report.location.address,
      upvoteCount: communityReport.upvote_count,
      curatorName: user.email || 'Unknown',
      reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reports/${report.id}`,
    });

    // Send email to all authorities
    const authorityEmails = authorities.map((a) => a.email);
    const trackingPixel = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/email/${communityReportId}`;

    const emailResult = await sendEmail({
      to: authorityEmails,
      subject: `Community Report: ${report.title}`,
      html: emailHtml,
      trackingPixel,
    });

    if (!emailResult.success) {
      return NextResponse.json({ error: emailResult.error || 'Failed to send email' }, { status: 500 });
    }

    // Create follow-up record
    const { count: existingFollowups } = await supabaseClient
      .from('community_report_followups')
      .select('*', { count: 'exact', head: true })
      .eq('community_report_id', communityReportId);

    const followupNumber = (existingFollowups || 0) + 1;

    await supabaseClient.from('community_report_followups').insert({
      community_report_id: communityReportId,
      followup_number: followupNumber,
      sent_at: new Date().toISOString(),
      response_status: 'pending',
    });

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      recipients: authorityEmails.length,
    });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

