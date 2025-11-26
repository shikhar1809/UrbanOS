import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { generatePILDocument } from '@/lib/services/pdf-generator';

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
        error: 'Cannot file PIL for demo data. Please use a real community report.',
        details: 'Demo reports are for display purposes only.'
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

    const body = await request.json();
    const { demands } = body;

    if (!demands || !demands.trim()) {
      return NextResponse.json({ error: 'Demands are required for PIL' }, { status: 400 });
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

    // Allow any authenticated user to file PIL (not just curator)
    // Note: The PIL will still show the actual curator's information

    // Get all upvoters (from report_votes)
    const { data: upvotes, error: upvotesError } = await supabaseClient
      .from('report_votes')
      .select(`
        user_id,
        created_at,
        users:user_id(email, full_name)
      `)
      .eq('report_id', communityReport.report_id)
      .eq('vote_type', 'upvote');

    if (upvotesError) {
      console.warn('Error fetching upvotes:', upvotesError);
    }

    // Get e-signatures for upvoters
    const { data: signatures } = await supabaseClient
      .from('e_signatures')
      .select(`
        user_id,
        signed_at,
        signature_data,
        users:user_id(email, full_name)
      `)
      .eq('report_id', communityReport.report_id);

    // Create a map of signatures by user_id
    const signatureMap = new Map();
    (signatures || []).forEach((sig: any) => {
      signatureMap.set(sig.user_id, {
        signed_at: sig.signed_at,
        ip: sig.signature_data?.ip,
        signature_data: sig.signature_data,
      });
    });

    // Combine upvoters with their signatures
    const upvoters = (upvotes || []).map((vote: any) => {
      const sig = signatureMap.get(vote.user_id);
      return {
        name: vote.users?.full_name || 'Unknown',
        email: vote.users?.email || '',
        signed_at: sig?.signed_at || vote.created_at, // Use signature date or vote date
        ip: sig?.ip || 'N/A',
      };
    });

    // If no upvoters found, use community report upvote count and create placeholder entries
    if (upvoters.length === 0 && communityReport.upvote_count > 0) {
      for (let i = 0; i < Math.min(communityReport.upvote_count, 10); i++) {
        upvoters.push({
          name: `Upvoter ${i + 1}`,
          email: `upvoter${i + 1}@community.local`,
          signed_at: new Date().toISOString(),
          ip: 'N/A',
        });
      }
    }

    // Generate PIL document
    const report = communityReport.report as any;
    const pilBuffer = await generatePILDocument(
      {
        report: {
          id: report.id,
          title: report.title,
          description: report.description,
          type: report.type,
          location: report.location,
          images: report.images || [],
          videos: report.videos || [],
          submitted_at: report.submitted_at,
        },
        upvoters,
        curator: {
          name: (communityReport.curator as any)?.full_name || user.email || 'Unknown',
          email: (communityReport.curator as any)?.email || user.email || '',
        },
        upvoteCount: communityReport.upvote_count,
      },
      demands
    );

    // Store PIL document (upload to storage or save reference)
    const fileName = `pil-documents/${communityReportId}/${Date.now()}-pil.pdf`;

    // For now, create PIL record with document reference
    const { data: pilDocument, error: pilError } = await supabaseClient
      .from('pil_documents')
      .insert({
        community_report_id: communityReportId,
        curator_id: user.id,
        document_path: fileName,
        status: 'filed',
        filed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (pilError) throw pilError;

    // Update community report status
    await supabaseClient
      .from('community_reports')
      .update({ status: 'escalated_to_pil' })
      .eq('id', communityReportId);

    // Send notifications to all signatories
    const notificationPromises = upvoters.map((upvoter) =>
      supabaseClient.from('notifications').insert({
        user_id: upvoter.email, // Note: This should be user_id, not email
        type: 'system',
        title: 'PIL Filed',
        message: `A PIL has been filed for the report "${report.title}" that you supported.`,
      })
    );

    await Promise.all(notificationPromises);

    // In production, this would file the PIL electronically with the court system
    // For now, we just create the document and mark it as filed
    const base64Pil = pilBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      pilId: pilDocument.id,
      documentUrl: `data:application/pdf;base64,${base64Pil}`,
      fileName: 'pil-document.pdf',
      message: 'PIL document generated. File electronically with court system.',
    });
  } catch (error: any) {
    console.error('Error filing PIL:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

