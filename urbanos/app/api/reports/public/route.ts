import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Public API route to fetch reports for map display
 * Uses service role key to bypass RLS policies for public viewing
 * This ensures reports are always visible on the map
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeApp = searchParams.get('activeApp');
    const dataView = searchParams.get('dataView');
    const limit = parseInt(searchParams.get('limit') || '500');

    // Use service role key to bypass RLS for public viewing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl) {
      console.error('Missing NEXT_PUBLIC_SUPABASE_URL');
      return NextResponse.json(
        { error: 'Server configuration error: Missing Supabase URL' },
        { status: 500 }
      );
    }

    if (!serviceRoleKey) {
      console.error('Missing SUPABASE_SERVICE_ROLE_KEY - API route fallback will not work');
      console.error('Please set SUPABASE_SERVICE_ROLE_KEY in Vercel environment variables');
      // Still try with anon key as fallback (might work if RLS allows)
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!anonKey) {
        return NextResponse.json(
          { error: 'Server configuration error: Missing Supabase keys' },
          { status: 500 }
        );
      }
      console.warn('Using anon key instead of service role key - RLS may still block access');
    }

    // Create Supabase client with service role key (bypasses RLS) or anon key as fallback
    const supabase = createClient(
      supabaseUrl, 
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    let query = supabase
      .from('reports')
      .select('*') // Select all fields for full report details
      .not('location', 'is', null) // Ensure location is not null
      .order('created_at', { ascending: false });

    // Apply filters based on view
    if (activeApp === 'security' || dataView === 'cybersecurity_alerts') {
      query = query.eq('type', 'cybersecurity');
    } else if (dataView === 'normal_alerts') {
      query = query.neq('type', 'cybersecurity');
    }
    // For 'all_alerts' or any other view, show ALL reports (no filter)

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching reports (service role):', error);
      return NextResponse.json(
        { error: 'Failed to fetch reports', details: error.message },
        { status: 500 }
      );
    }

    // Filter out reports with invalid locations
    const validReports = (data || []).filter((report: any) => {
      if (!report.location) return false;
      if (typeof report.location.lat !== 'number' || typeof report.location.lng !== 'number') {
        return false;
      }
      if (isNaN(report.location.lat) || isNaN(report.location.lng)) {
        return false;
      }
      return true;
    });

    console.log(`✅ Public reports API: Found ${validReports.length} valid reports out of ${(data || []).length} total`);
    
    if (validReports.length === 0 && (data || []).length > 0) {
      console.warn('⚠️ Some reports have invalid locations and were filtered out');
    }

    return NextResponse.json({
      success: true,
      reports: validReports,
      count: validReports.length,
      totalFetched: (data || []).length,
      filteredOut: (data || []).length - validReports.length,
    });
  } catch (error: any) {
    console.error('Exception in public reports API:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

