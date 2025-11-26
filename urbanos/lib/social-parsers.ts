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

interface ParseSocialReportOptions {
  latitude?: number;
  longitude?: number;
}

/**
 * Reverse geocode GPS coordinates to address using OpenStreetMap Nominatim API
 */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'UrbanOS/1.0', // Required by Nominatim
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding failed');
    }

    const data = await response.json();
    
    if (data && data.address) {
      const addr = data.address;
      // Build address string from most specific to least specific
      const addressParts: string[] = [];
      
      if (addr.house_number && addr.road) {
        addressParts.push(`${addr.house_number} ${addr.road}`);
      } else if (addr.road) {
        addressParts.push(addr.road);
      }
      
      if (addr.neighbourhood || addr.suburb) {
        addressParts.push(addr.neighbourhood || addr.suburb);
      }
      
      if (addr.city || addr.town || addr.village) {
        addressParts.push(addr.city || addr.town || addr.village);
      }
      
      if (addr.state_district && !addressParts.includes(addr.state_district)) {
        addressParts.push(addr.state_district);
      }
      
      if (addr.state) {
        addressParts.push(addr.state);
      }
      
      if (addr.postcode) {
        addressParts.push(addr.postcode);
      }
      
      if (addressParts.length > 0) {
        return addressParts.join(', ');
      }
      
      // Fallback to display_name if address parts are empty
      if (data.display_name) {
        return data.display_name;
      }
    }
    
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch (error) {
    console.warn('Reverse geocoding failed:', error);
    // Fallback to coordinates
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}

/**
 * Parse social media report from message text
 * Supports hashtags for report type and optional GPS coordinates
 */
export async function parseSocialReport(
  message: string,
  options?: ParseSocialReportOptions
): Promise<ParsedReport | null> {
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

  // Default to Lucknow, India coordinates
  let lat = 26.8467;
  let lng = 80.9462;
  let address = 'Lucknow, Uttar Pradesh, India';

  // Use GPS coordinates if provided (from WhatsApp location sharing)
  if (options?.latitude && options?.longitude) {
    lat = options.latitude;
    lng = options.longitude;
    // Reverse geocode to get address
    address = await reverseGeocode(lat, lng);
  } else {
    // Extract location from text if provided
    // Format: @location: address or coordinates
    const locationRegex = /@location[:\s]+([^\n]+)/i;
    const locationMatch = message.match(locationRegex);
    
    if (locationMatch) {
      const locationText = locationMatch[1].trim();
      address = locationText;
      
      // Try to extract coordinates from text if present
      const coordMatch = locationText.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
      if (coordMatch) {
        lat = parseFloat(coordMatch[1]);
        lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          // Reverse geocode coordinates to address
          address = await reverseGeocode(lat, lng);
        }
      }
    }
  }

  // Generate title from first line or type
  const firstLine = description.split('\n')[0];
  const title = firstLine.length > 10 ? firstLine.substring(0, 50) : `${type} issue`;

  return {
    type,
    title,
    description,
    location: {
      lat,
      lng,
      address,
    },
  };
}

export function createReportResponse(reportId: string, platform: string): string {
  return `✅ Your report has been received!\n\n📋 Report ID: ${reportId}\n\nWe'll keep you updated on the progress. Thank you for helping improve our community!\n\n- UrbanOS Team`;
}

