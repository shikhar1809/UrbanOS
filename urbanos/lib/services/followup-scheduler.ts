/**
 * Follow-up Scheduler Service
 * Automatically sends follow-up emails for community reports
 */

import { createClient } from '@/lib/supabase-server';
import { sendEmail, generateCommunityReportEmail } from './email-service';

/**
 * Check for pending follow-ups and send automated reminders
 * This should be called by a cron job or scheduled function
 */
export async function processPendingFollowups() {
  try {
    const supabase = await createClient();

    // Get community reports that need follow-ups
    // Check for reports where last follow-up was sent more than 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: communityReports } = await supabase
      .from('community_reports')
      .select('*, report:reports(*)')
      .eq('status', 'active');

    if (!communityReports) return;

    for (const cr of communityReports) {
      // Get last follow-up
      const { data: lastFollowup } = await supabase
        .from('community_report_followups')
        .select('*')
        .eq('community_report_id', cr.id)
        .order('sent_at', { ascending: false })
        .limit(1)
        .single();

      // If no follow-up yet, or last follow-up was more than 7 days ago
      const shouldSendFollowup =
        !lastFollowup ||
        (lastFollowup.response_status === 'pending' &&
          new Date(lastFollowup.sent_at) < sevenDaysAgo);

      if (shouldSendFollowup) {
        // Send automated follow-up email
        const report = cr.report as any;
        
        // Get authority emails (simplified - in production, use stored authority_ids)
        const { data: agencies } = await supabase
          .from('agencies')
          .select('email')
          .limit(10); // Simplified

        if (agencies && agencies.length > 0) {
          const emailHtml = generateCommunityReportEmail({
            reportTitle: report.title,
            reportDescription: report.description,
            reportType: report.type,
            location: report.location.address,
            upvoteCount: cr.upvote_count,
            curatorName: 'UrbanOS System',
            reportUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reports/${report.id}`,
          });

          const trackingPixel = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tracking/email/${cr.id}`;

          await sendEmail({
            to: agencies.map((a) => a.email),
            subject: `Follow-up: Community Report - ${report.title}`,
            html: emailHtml,
            trackingPixel,
          });

          // Create follow-up record
          const followupNumber = lastFollowup ? lastFollowup.followup_number + 1 : 1;
          await supabase.from('community_report_followups').insert({
            community_report_id: cr.id,
            followup_number: followupNumber,
            sent_at: new Date().toISOString(),
            response_status: 'pending',
          });
        }
      }
    }
  } catch (error) {
    console.error('Error in follow-up scheduler:', error);
  }
}

