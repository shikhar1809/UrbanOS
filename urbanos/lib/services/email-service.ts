/**
 * Email Service using Resend API
 */

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
  trackingPixel?: string; // For email open tracking
}

/**
 * Send email using Resend API
 */
export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    // Add tracking pixel to HTML if provided
    let html = options.html;
    if (options.trackingPixel) {
      html += `<img src="${options.trackingPixel}" width="1" height="1" style="display:none" />`;
    }

    const recipients = Array.isArray(options.to) ? options.to : [options.to];

    // Use Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || 'UrbanOS <noreply@urbanos.app>',
        to: recipients,
        subject: options.subject,
        html: html,
        attachments: options.attachments?.map(att => ({
          filename: att.filename,
          content: typeof att.content === 'string' 
            ? att.content 
            : att.content.toString('base64'),
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to send email');
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    console.error('Email service error:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

/**
 * Generate email template for community report
 */
export function generateCommunityReportEmail(data: {
  reportTitle: string;
  reportDescription: string;
  reportType: string;
  location: string;
  upvoteCount: number;
  curatorName: string;
  reportUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #0078d4; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .content { background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; padding: 12px 24px; background: #0078d4; color: white; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Community Report Notification</h1>
    </div>
    <div class="content">
      <p>Dear Authority,</p>
      
      <p>A community report has been submitted and has received significant community support:</p>
      
      <h2>${data.reportTitle}</h2>
      <p><strong>Type:</strong> ${data.reportType}</p>
      <p><strong>Location:</strong> ${data.location}</p>
      <p><strong>Community Support:</strong> ${data.upvoteCount} upvotes</p>
      
      <p><strong>Description:</strong></p>
      <p>${data.reportDescription}</p>
      
      <p>This issue has been identified as a priority by ${data.upvoteCount} community members who have signed their support.</p>
      
      <p>Please review this report and provide updates on the resolution status.</p>
      
      <a href="${data.reportUrl}" class="button">View Full Report</a>
      
      <p>Curated by: ${data.curatorName}</p>
      
      <hr>
      <p style="font-size: 12px; color: #666;">
        This is an automated email from UrbanOS - Your City, Your Voice
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

