import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

/**
 * Email tracking pixel endpoint
 * Tracks email opens by incrementing email_opens_count in followups table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; params?: string[] }> }
) {
  try {
    const { id, params: paramsArray } = await params;
    const communityReportId = id;
    const followupNumber = paramsArray?.[0] ? parseInt(paramsArray[0]) : null;

    const supabase = await createClient();

    // Increment email opens count
    if (followupNumber) {
      // Get current count first, then update
      const { data: currentFollowup } = await supabase
        .from('community_report_followups')
        .select('email_opens_count')
        .eq('community_report_id', communityReportId)
        .eq('followup_number', followupNumber)
        .single();

      const newCount = (currentFollowup?.email_opens_count || 0) + 1;

      await supabase
        .from('community_report_followups')
        .update({ email_opens_count: newCount })
        .eq('community_report_id', communityReportId)
        .eq('followup_number', followupNumber);
    }

    // Return a 1x1 transparent GIF pixel
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );

    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error) {
    console.error('Error tracking email open:', error);
    // Return transparent pixel even on error
    const pixel = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    return new NextResponse(pixel, {
      headers: {
        'Content-Type': 'image/gif',
        'Cache-Control': 'no-cache',
      },
    });
  }
}

