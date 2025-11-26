import { supabase } from '@/lib/supabase';

export interface Authority {
  id: string;
  name: string;
  type: string;
  email: string;
  phone: string;
  region: string;
}

/**
 * Get relevant authorities based on report location
 * This is a simplified version - in production, you'd use reverse geocoding
 * to determine the exact jurisdiction/region and match with authorities
 */
export async function getAuthoritiesByLocation(
  location: { lat: number; lng: number; address: string }
): Promise<Authority[]> {
  try {
    // Extract region/city from address string (simplified)
    // In production, use reverse geocoding API to get proper jurisdiction
    const addressParts = location.address.split(',');
    const region = addressParts[addressParts.length - 1]?.trim() || '';

    // Query agencies by region
    const { data, error } = await supabase
      .from('agencies')
      .select('*')
      .ilike('region', `%${region}%`)
      .order('avg_response_time_hours', { ascending: true });

    if (error) {
      console.error('Error fetching authorities:', error);
      return [];
    }

    return (data || []).map((agency) => ({
      id: agency.id,
      name: agency.name,
      type: agency.type,
      email: agency.email,
      phone: agency.phone,
      region: agency.region,
    }));
  } catch (error) {
    console.error('Error in getAuthoritiesByLocation:', error);
    return [];
  }
}

/**
 * Get authorities by report type and location
 * Some report types may require specific agency types
 */
export async function getAuthoritiesByTypeAndLocation(
  reportType: string,
  location: { lat: number; lng: number; address: string }
): Promise<Authority[]> {
  const allAuthorities = await getAuthoritiesByLocation(location);

  // Map report types to agency types (simplified mapping)
  const typeMappings: Record<string, string[]> = {
    cyber: ['Cybersecurity', 'IT Department', 'Police'],
    road_safety_hazards: ['Transport Department', 'Public Works', 'Traffic Police'],
    public_infrastructure: ['Public Works', 'Municipal Corporation', 'Infrastructure'],
    pothole: ['Public Works', 'Municipal Corporation', 'Roads Department'],
    streetlight: ['Public Works', 'Electricity Department', 'Municipal Corporation'],
    garbage: ['Sanitation Department', 'Municipal Corporation', 'Waste Management'],
    animal_carcass: ['Sanitation Department', 'Municipal Corporation', 'Public Works', 'Animal Control'],
    environmental: ['Environmental Department', 'Pollution Control', 'Municipal Corporation'],
    health_safety: ['Health Department', 'Safety Department', 'Municipal Corporation'],
    other: [], // No specific mapping, return all
  };

  const relevantTypes = typeMappings[reportType] || [];

  if (relevantTypes.length === 0) {
    return allAuthorities;
  }

  // Filter authorities by type
  return allAuthorities.filter((auth) =>
    relevantTypes.some((type) => auth.type.toLowerCase().includes(type.toLowerCase()))
  );
}

