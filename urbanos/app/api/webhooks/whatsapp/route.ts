import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSocialReport, createReportResponse } from '@/lib/social-parsers';
import { parseTwilioMessage, sendWhatsAppMessage, downloadTwilioMedia, extractPhoneNumber } from '@/lib/services/twilio-service';
import { getOrCreateWhatsAppUser } from '@/lib/services/whatsapp-user-service';
import type { TwilioWebhookPayload } from '@/lib/services/twilio-service';

// Create Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * GET handler for Twilio webhook verification
 * Twilio sends a GET request with validation parameters
 */
export async function GET(request: NextRequest) {
  // Twilio webhook verification (not used in sandbox mode, but good to have)
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  // Support both Meta/Facebook format (legacy) and Twilio format
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  // For Twilio, we can just return 200 if webhook URL is configured
  // Twilio doesn't require verification in the same way Meta does
  return NextResponse.json({ message: 'WhatsApp webhook endpoint active' }, { status: 200 });
}

/**
 * POST handler for incoming WhatsApp messages via Twilio
 * Handles text messages, location sharing, and media attachments
 */
export async function POST(request: NextRequest) {
  try {
    // Twilio sends form-encoded data (application/x-www-form-urlencoded)
    // Next.js can parse this from request body
    let payload: TwilioWebhookPayload;
    
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Parse URL-encoded form data
      const formData = await request.formData();
      payload = Object.fromEntries(formData.entries()) as any;
    } else if (contentType.includes('application/json')) {
      // Parse JSON (for testing or if Twilio sends JSON)
      payload = await request.json();
    } else {
      // Try to parse as form data (default for Twilio)
      try {
        const formData = await request.formData();
        payload = Object.fromEntries(formData.entries()) as any;
      } catch {
        // Last resort: try JSON
        payload = await request.json();
      }
    }

    // Parse Twilio message
    const twilioMessage = parseTwilioMessage(payload);
    
    if (!twilioMessage) {
      console.warn('Invalid Twilio webhook payload:', payload);
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    console.log('Received WhatsApp message:', {
      from: twilioMessage.from,
      body: twilioMessage.body,
      hasLocation: twilioMessage.hasLocation,
      mediaCount: twilioMessage.mediaUrls.length,
    });

    // Get or create system user for WhatsApp reports
    const { userId: systemUserId, error: userError } = await getOrCreateWhatsAppUser();
    
    if (!systemUserId) {
      console.error('Failed to get system user:', userError);
      // Send error message to user
      await sendWhatsAppMessage(
        twilioMessage.from,
        '❌ Sorry, there was an error processing your report. Please try again later or contact support.'
      );
      return NextResponse.json({ error: userError || 'System user not available' }, { status: 500 });
    }

    // Parse report from message text
    const parsedReport = await parseSocialReport(
      twilioMessage.body,
      twilioMessage.hasLocation && twilioMessage.latitude && twilioMessage.longitude
        ? {
            latitude: twilioMessage.latitude,
            longitude: twilioMessage.longitude,
          }
        : undefined
    );

    if (!parsedReport) {
      // Send helpful message to user
      await sendWhatsAppMessage(
        twilioMessage.from,
        '📝 Please format your message with a hashtag to indicate the issue type:\n\n' +
        '#pothole - Road potholes\n' +
        '#streetlight - Street light issues\n' +
        '#garbage - Waste management\n' +
        '#animal - Dead animal removal\n' +
        '#cybersecurity - Security concerns\n\n' +
        'Also share your location for accurate reporting. Example:\n' +
        '#pothole Found a large pothole on MG Road'
      );
      return NextResponse.json({ success: true, message: 'Message received but not parsed as report' });
    }

    // Download and upload media files
    const imageUrls: string[] = [];
    const videoUrls: string[] = [];

    for (const media of twilioMessage.mediaUrls) {
      const downloadResult = await downloadTwilioMedia(media.url);
      
      if (downloadResult.success && downloadResult.buffer) {
        // Determine if it's an image or video
        const isImage = media.contentType.startsWith('image/');
        const isVideo = media.contentType.startsWith('video/');
        
        if (isImage || isVideo) {
          // Create a unique filename
          const fileExt = media.contentType.split('/')[1] || 'jpg';
          const fileName = `whatsapp/${systemUserId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
          
          const bucket = isImage ? 'report-images' : 'report-videos';
          
          // Upload to Supabase storage
          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, downloadResult.buffer, {
              contentType: media.contentType,
              upsert: false,
            });

          if (!uploadError) {
            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from(bucket)
              .getPublicUrl(fileName);

            if (isImage) {
              imageUrls.push(publicUrl);
            } else {
              videoUrls.push(publicUrl);
            }
          } else {
            console.error('Error uploading media:', uploadError);
          }
        }
      }
    }

    // Create report in database
    const { data: report, error: insertError } = await supabase
      .from('reports')
      .insert({
        user_id: systemUserId,
        type: parsedReport.type,
        title: parsedReport.title,
        description: parsedReport.description,
        location: parsedReport.location,
        images: imageUrls,
        videos: videoUrls,
        source: 'whatsapp',
        is_anonymous: true, // WhatsApp reports are anonymous
        status: 'submitted',
        priority: 'medium',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating report:', insertError);
      
      // Send error message to user
      await sendWhatsAppMessage(
        twilioMessage.from,
        '❌ Sorry, there was an error saving your report. Please try again later.'
      );
      
      return NextResponse.json(
        { error: 'Failed to create report', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('✅ WhatsApp report created successfully:', report.id);

    // Send confirmation message to user
    const confirmationMessage = createReportResponse(report.id, 'WhatsApp');
    await sendWhatsAppMessage(twilioMessage.from, confirmationMessage);

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report created successfully',
    });
  } catch (error: any) {
    console.error('WhatsApp webhook error:', error);
    
    // Try to send error message to user if we have their number
    // Note: We can't re-read the request body, so we skip this if we're in error handler
    // The error message will be logged in the console for debugging
    
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}
