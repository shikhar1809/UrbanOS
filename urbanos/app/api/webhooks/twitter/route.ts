import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { parseSocialReport, createReportResponse } from '@/lib/social-parsers';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Process Twitter/X webhook payload
    // This is for Account Activity API webhooks
    if (body.tweet_create_events) {
      for (const tweet of body.tweet_create_events) {
        const text = tweet.text;
        const userId = tweet.user.id_str;

        // Check if tweet mentions @UrbanOS
        if (text.includes('@UrbanOS')) {
          // Parse the report from tweet
          const parsed = await parseSocialReport(text);
          if (parsed) {
            // Create report in database
            const { data, error } = await supabase
              .from('reports')
              .insert({
                user_id: userId, // In production, map this to a real user
                type: parsed.type,
                title: parsed.title,
                description: parsed.description,
                location: parsed.location,
                source: 'twitter',
              })
              .select()
              .single();

            if (error) throw error;

            // Send confirmation reply (implement Twitter API call here)
            // await replyToTweet(tweet.id_str, createReportResponse(data.id, 'Twitter'));
            console.log('Twitter report created:', data.id);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Twitter webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// CRC challenge for Twitter Account Activity API
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const crc_token = searchParams.get('crc_token');

  if (crc_token) {
    // In production, implement proper HMAC-SHA256 response
    // using your Twitter consumer secret
    const response_token = `sha256=${crc_token}`;
    return NextResponse.json({ response_token });
  }

  return NextResponse.json({ error: 'No CRC token provided' }, { status: 400 });
}

