import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generateCommunityReportPDF } from '@/lib/services/pdf-generator';

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
      .select('*, report:reports(*), curator:users!curator_id(email, full_name)')
      .eq('id', communityReportId)
      .single();

    if (crError || !communityReport) {
      return NextResponse.json({ error: 'Community report not found' }, { status: 404 });
    }

    // Verify user is curator
    if (communityReport.curator_id !== user.id) {
      return NextResponse.json({ error: 'Only curator can generate document' }, { status: 403 });
    }

    // Get all upvoters with e-signatures
    const { data: signatures, error: sigError } = await supabaseClient
      .from('e_signatures')
      .select(`
        user_id,
        signed_at,
        signature_data,
        users:user_id(email, full_name)
      `)
      .eq('report_id', communityReport.report_id);

    // If no signatures found, that's okay - continue with empty array
    if (sigError) {
      console.warn('Error fetching signatures (continuing anyway):', sigError);
    }

    const upvoters = (signatures || []).map((sig: any) => ({
      name: sig.users?.full_name || sig.signature_data?.name || 'Unknown',
      email: sig.users?.email || sig.signature_data?.email || '',
      signed_at: sig.signed_at || new Date().toISOString(),
      ip: sig.signature_data?.ip || 'N/A',
    }));

    // Generate PDF
    const report = communityReport.report as any;
    
    if (!report) {
      return NextResponse.json({ error: 'Report data not found' }, { status: 404 });
    }

    // Ensure all required fields exist
    if (!report.title || !report.description || !report.location) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 400 });
    }

    const pdfBuffer = await generateCommunityReportPDF({
      report: {
        id: report.id || communityReport.report_id,
        title: report.title || 'Untitled Report',
        description: report.description || '',
        type: report.type || 'other',
        location: report.location || { address: 'Location not specified', lat: 0, lng: 0 },
        images: report.images || [],
        videos: report.videos || [],
        submitted_at: report.submitted_at || report.created_at || new Date().toISOString(),
      },
      upvoters: upvoters.length > 0 ? upvoters : [{
        name: 'No signatures yet',
        email: '',
        signed_at: new Date().toISOString(),
        ip: 'N/A',
      }],
      curator: {
        name: (communityReport.curator as any)?.full_name || user.email?.split('@')[0] || 'Unknown Curator',
        email: (communityReport.curator as any)?.email || user.email || '',
      },
      upvoteCount: communityReport.upvote_count || 0,
    });

    // Return PDF as base64 (storage upload is optional)
    // In production, you can upload to storage bucket if needed
    const base64Pdf = pdfBuffer.toString('base64');
    
    return NextResponse.json({
      success: true,
      documentUrl: `data:application/pdf;base64,${base64Pdf}`,
      fileName: 'community-report.pdf',
      message: 'Document generated successfully',
    });
  } catch (error: any) {
    console.error('Error generating document:', error);
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

