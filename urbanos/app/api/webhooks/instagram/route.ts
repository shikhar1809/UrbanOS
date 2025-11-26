import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSocialReport, createReportResponse } from '@/lib/social-parsers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: NextRequest) {
  // Verification endpoint for Instagram
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.INSTAGRAM_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process Instagram webhook payload
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        if (entry.messaging) {
          for (const event of entry.messaging) {
            if (event.message && event.message.text) {
              const message = event.message.text;
              const senderId = event.sender.id;

              // Parse the report from message
              const parsed = parseSocialReport(message);
              if (parsed) {
                // Create report in database
                const { data, error } = await supabase
                  .from('reports')
                  .insert({
                    user_id: senderId, // In production, map this to a real user
                    type: parsed.type,
                    title: parsed.title,
                    description: parsed.description,
                    location: parsed.location,
                    source: 'instagram',
                  })
                  .select()
                  .single();

                if (error) throw error;

                // Send confirmation (implement Instagram Graph API call here)
                // await sendInstagramMessage(senderId, createReportResponse(data.id, 'Instagram'));
                console.log('Instagram report created:', data.id);
              }
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Instagram webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

