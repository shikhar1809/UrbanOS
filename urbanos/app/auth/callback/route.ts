import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const next = requestUrl.searchParams.get('next') || '/';
  
  // Debug: Log all query parameters
  console.log('[OAuth Callback] URL:', requestUrl.toString());
  console.log('[OAuth Callback] Query params:', Object.fromEntries(requestUrl.searchParams.entries()));
  
  // Check for Supabase OAuth errors first
  const supabaseError = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

  if (supabaseError) {
    // Supabase returned an error, redirect with error info
    const redirectUrl = new URL(next, requestUrl.origin);
    redirectUrl.searchParams.delete('code');
    redirectUrl.searchParams.delete('next');
    redirectUrl.searchParams.set('error', supabaseError);
    if (errorDescription) {
      redirectUrl.searchParams.set('error_description', errorDescription);
    }
    return NextResponse.redirect(redirectUrl);
  }

  if (code) {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        // Successfully exchanged code for session
        // Cookies are automatically set by the server client
        // Redirect to landing page
        const redirectUrl = new URL(next, requestUrl.origin);
        redirectUrl.searchParams.delete('code');
        redirectUrl.searchParams.delete('next');
        
        const response = NextResponse.redirect(redirectUrl);
        return response;
      } else {
        console.error('Error exchanging code for session:', error);
        const redirectUrl = new URL(next, requestUrl.origin);
        redirectUrl.searchParams.delete('code');
        redirectUrl.searchParams.delete('next');
        redirectUrl.searchParams.set('error', error?.message || 'auth_failed');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error: any) {
      console.error('Exception in callback:', error);
      const redirectUrl = new URL(next, requestUrl.origin);
      redirectUrl.searchParams.delete('code');
      redirectUrl.searchParams.delete('next');
      redirectUrl.searchParams.set('error', error?.message || 'callback_error');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // No code and no error - check if session already exists
  // Supabase might have processed the OAuth server-side and set cookies
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      // Session exists, OAuth succeeded (Supabase handled it server-side)
      console.log('[OAuth Callback] Session exists, redirecting to:', next);
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  } catch (err) {
    console.error('[OAuth Callback] Error checking session:', err);
  }
  
  // No code, no error, no session - might be a direct visit to callback route
  // Just redirect to home (don't show error, allow user to try again)
  console.log('[OAuth Callback] No code, no session - redirecting to home');
  return NextResponse.redirect(new URL(next, requestUrl.origin));
}
