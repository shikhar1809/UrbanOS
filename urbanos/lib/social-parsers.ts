import { ReportType } from '@/types';

interface ParsedReport {
  type: ReportType;
  title: string;
  description: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
}

export function parseSocialReport(message: string): ParsedReport | null {
  // Extract hashtags and content
  const hashtagRegex = /#(\w+)/g;
  const hashtags = [...message.matchAll(hashtagRegex)].map((m) => m[1].toLowerCase());

  // Determine report type based on hashtags
  let type: ReportType = 'other';
  if (hashtags.includes('pothole') || hashtags.includes('road')) {
    type = 'pothole';
  } else if (hashtags.includes('streetlight') || hashtags.includes('light')) {
    type = 'streetlight';
  } else if (hashtags.includes('garbage') || hashtags.includes('waste')) {
    type = 'garbage';
  } else if (hashtags.includes('animal') || hashtags.includes('carcass') || hashtags.includes('roadkill') || hashtags.includes('deadanimal')) {
    type = 'animal_carcass';
  } else if (hashtags.includes('cybersecurity') || hashtags.includes('security')) {
    type = 'cybersecurity';
  }

  // Remove hashtags from description
  const description = message.replace(hashtagRegex, '').trim();

  // Extract location if provided (simple implementation)
  // Format: @location: address or coordinates
  const locationRegex = /@location[:\s]+([^\n]+)/i;
  const locationMatch = message.match(locationRegex);

  let location = {
    lat: 40.7128, // Default to NYC
    lng: -74.006,
    address: locationMatch ? locationMatch[1].trim() : 'Location from social media',
  };

  // Generate title from first line or type
  const firstLine = description.split('\n')[0];
  const title = firstLine.length > 10 ? firstLine.substring(0, 50) : `${type} issue`;

  return {
    type,
    title,
    description,
    location,
  };
}

export function createReportResponse(reportId: string, platform: string): string {
  return `✅ Your report has been received!\n\n📋 Report ID: ${reportId}\n\nWe'll keep you updated on the progress. Thank you for helping improve our community!\n\n- UrbanOS Team`;
}

