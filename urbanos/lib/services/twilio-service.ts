import twilio from 'twilio';

/**
 * Twilio Service for WhatsApp Integration
 * Handles sending messages, downloading media, and parsing webhook payloads
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886';

// Initialize Twilio client
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface TwilioWebhookPayload {
  MessageSid?: string;
  AccountSid?: string;
  MessagingServiceSid?: string;
  From?: string;
  To?: string;
  Body?: string;
  NumMedia?: string;
  MediaUrl0?: string;
  MediaUrl1?: string;
  MediaUrl2?: string;
  MediaUrl3?: string;
  MediaContentType0?: string;
  MediaContentType1?: string;
  MediaContentType2?: string;
  MediaContentType3?: string;
  Latitude?: string;
  Longitude?: string;
}

export interface ParsedTwilioMessage {
  messageSid: string;
  from: string;
  to: string;
  body: string;
  hasLocation: boolean;
  latitude?: number;
  longitude?: number;
  mediaUrls: Array<{
    url: string;
    contentType: string;
  }>;
}

/**
 * Parse incoming Twilio webhook payload
 */
export function parseTwilioMessage(payload: TwilioWebhookPayload): ParsedTwilioMessage | null {
  if (!payload.MessageSid || !payload.From || !payload.To) {
    return null;
  }

  const numMedia = parseInt(payload.NumMedia || '0', 10);
  const mediaUrls: Array<{ url: string; contentType: string }> = [];

  // Extract media URLs
  for (let i = 0; i < numMedia && i < 4; i++) {
    const url = payload[`MediaUrl${i}` as keyof TwilioWebhookPayload] as string | undefined;
    const contentType = payload[`MediaContentType${i}` as keyof TwilioWebhookPayload] as string | undefined;
    
    if (url) {
      mediaUrls.push({
        url,
        contentType: contentType || 'application/octet-stream',
      });
    }
  }

  // Extract location if provided
  const hasLocation = !!(payload.Latitude && payload.Longitude);
  const latitude = payload.Latitude ? parseFloat(payload.Latitude) : undefined;
  const longitude = payload.Longitude ? parseFloat(payload.Longitude) : undefined;

  return {
    messageSid: payload.MessageSid,
    from: payload.From,
    to: payload.To,
    body: payload.Body || '',
    hasLocation,
    latitude,
    longitude,
    mediaUrls,
  };
}

/**
 * Send WhatsApp message via Twilio
 */
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageSid?: string; error?: string }> {
  if (!client) {
    return {
      success: false,
      error: 'Twilio client not initialized. Please check environment variables.',
    };
  }

  try {
    // Ensure 'whatsapp:' prefix
    const toNumber = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    const fromNumber = whatsappNumber;

    const messageResult = await client.messages.create({
      from: fromNumber,
      to: toNumber,
      body: message,
    });

    return {
      success: true,
      messageSid: messageResult.sid,
    };
  } catch (error: any) {
    console.error('Error sending WhatsApp message:', error);
    return {
      success: false,
      error: error.message || 'Failed to send message',
    };
  }
}

/**
 * Download media from Twilio URL
 * Twilio media URLs require authentication with AccountSid and AuthToken
 */
export async function downloadTwilioMedia(mediaUrl: string): Promise<{
  success: boolean;
  buffer?: Buffer;
  contentType?: string;
  error?: string;
}> {
  if (!accountSid || !authToken) {
    return {
      success: false,
      error: 'Twilio credentials not configured',
    };
  }

  try {
    // Twilio media URLs require basic auth with AccountSid:AuthToken
    const credentials = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    
    const response = await fetch(mediaUrl, {
      headers: {
        Authorization: `Basic ${credentials}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to download media: ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return {
      success: true,
      buffer,
      contentType,
    };
  } catch (error: any) {
    console.error('Error downloading Twilio media:', error);
    return {
      success: false,
      error: error.message || 'Failed to download media',
    };
  }
}

/**
 * Extract phone number from Twilio WhatsApp format
 * Converts 'whatsapp:+916386620642' to '+916386620642'
 */
export function extractPhoneNumber(whatsappNumber: string): string {
  return whatsappNumber.replace(/^whatsapp:/, '');
}

