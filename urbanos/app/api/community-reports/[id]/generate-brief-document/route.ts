import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateBriefDocumentPDF } from '@/lib/services/pdf-generator';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabaseClient = await createClient();
    const { id } = await params;
    const communityReportId = id;

    // Validate UUID format - demo data uses string IDs like "demo-escalated-001"
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(communityReportId)) {
      return NextResponse.json({ 
        error: 'Cannot generate document for demo data. Please use a real community report.',
        details: 'Demo reports are for display purposes only and cannot generate documents.'
      }, { status: 400 });
    }

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
      .select('*')
      .eq('id', communityReportId)
      .single();

    if (crError || !communityReport) {
      console.error('Error fetching community report:', crError);
      return NextResponse.json({ 
        error: 'Community report not found',
        details: process.env.NODE_ENV === 'development' ? crError?.message : undefined
      }, { status: 404 });
    }

    // Allow any authenticated user to generate documents (not just curator)
    // Note: The document will still show the actual curator's information

    // Fetch the report separately
    const { data: report, error: reportError } = await supabaseClient
      .from('reports')
      .select('*')
      .eq('id', communityReport.report_id)
      .single();

    if (reportError || !report) {
      console.error('Error fetching report:', reportError);
      return NextResponse.json({ 
        error: 'Report data not found',
        details: process.env.NODE_ENV === 'development' ? reportError?.message : undefined
      }, { status: 404 });
    }

    // Get curator info
    const { data: curatorData } = await supabaseClient
      .from('users')
      .select('email, full_name')
      .eq('id', communityReport.curator_id)
      .single();

    // Fetch all followups (government communications)
    const { data: followups, error: followupsError } = await supabaseClient
      .from('community_report_followups')
      .select('*')
      .eq('community_report_id', communityReportId)
      .order('sent_at', { ascending: true });

    if (followupsError) {
      console.warn('Error fetching followups (continuing anyway):', followupsError);
    }

    // Fetch report history (government actions and updates)
    const { data: reportHistory, error: historyError } = await supabaseClient
      .from('report_history')
      .select(`
        *,
        agency:agencies(name),
        performer:users!performed_by(full_name, email)
      `)
      .eq('report_id', communityReport.report_id)
      .order('created_at', { ascending: true });

    if (historyError) {
      console.warn('Error fetching report history (continuing anyway):', historyError);
    }

    // Generate PDF
    const pdfBuffer = await generateBriefDocumentPDF({
      report: {
        id: report.id || communityReport.report_id,
        title: report.title || 'Untitled Report',
        description: report.description || '',
        type: report.type || 'other',
        location: report.location || { address: 'Location not specified', lat: 0, lng: 0 },
        images: report.images || [],
        videos: report.videos || [],
        submitted_at: report.submitted_at || report.created_at || new Date().toISOString(),
        status: report.status || 'submitted',
        priority: report.priority || 'medium',
      },
      followups: (followups || []).map((f: any) => ({
        followupNumber: f.followup_number,
        sentAt: f.sent_at,
        responseReceivedAt: f.response_received_at,
        responseStatus: f.response_status,
        authorityResponse: f.authority_response,
        curatorNotes: f.curator_notes,
        emailOpensCount: f.email_opens_count || 0,
      })),
      reportHistory: (reportHistory || []).map((h: any) => ({
        actionType: h.action_type,
        description: h.description,
        oldValue: h.old_value,
        newValue: h.new_value,
        performedAt: h.created_at,
        performedBy: h.performer?.full_name || h.performer?.email || 'System',
        agencyName: h.agency?.name || null,
      })),
      curator: {
        name: curatorData?.full_name || user.email?.split('@')[0] || 'Unknown Curator',
        email: curatorData?.email || user.email || '',
      },
      upvoteCount: communityReport.upvote_count || 0,
    });

    // Return PDF as base64
    const base64Pdf = pdfBuffer.toString('base64');
    
    return NextResponse.json({
      success: true,
      documentUrl: `data:application/pdf;base64,${base64Pdf}`,
      fileName: 'community-report-brief.pdf',
      message: 'Brief document generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating brief document:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

