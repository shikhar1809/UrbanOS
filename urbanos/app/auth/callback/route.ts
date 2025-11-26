import { createClient } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  // Decode the next parameter and validate it (security: prevent open redirect)
  const nextParam = requestUrl.searchParams.get('next') || '/';
  // Only allow redirects to same origin paths (prevent open redirect attacks)
  const nextPath = nextParam.startsWith('/') && !nextParam.startsWith('//') 
    ? nextParam 
    : '/';
  
  // Debug: Log all query parameters
  console.log('[OAuth Callback] URL:', requestUrl.toString());
  console.log('[OAuth Callback] Next path:', nextPath);
  console.log('[OAuth Callback] Query params:', Object.fromEntries(requestUrl.searchParams.entries()));
  
  // Check for Supabase OAuth errors first
  const supabaseError = requestUrl.searchParams.get('error');
  const errorDescription = requestUrl.searchParams.get('error_description');

    if (supabaseError) {
      // Supabase returned an error, redirect with error info to preserved path
      const redirectUrl = new URL(nextPath, requestUrl.origin);
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
      
      // For PKCE flow, we need to exchange the code with the verifier
      // The @supabase/ssr package handles this automatically via cookies
      // If the code verifier is not in cookies, we need to handle it differently
      
      // Try to exchange code for session
      // With @supabase/ssr, the code verifier should be in cookies if OAuth was initiated from the same browser
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        // Successfully exchanged code for session
        // Cookies are automatically set by the server client
        // Redirect to the preserved path (or landing page)
        const redirectUrl = new URL(nextPath, requestUrl.origin);
        redirectUrl.searchParams.delete('code');
        redirectUrl.searchParams.delete('next');
        
        console.log('[OAuth Callback] Successfully authenticated, redirecting to:', redirectUrl.toString());
        const response = NextResponse.redirect(redirectUrl);
        return response;
      } else {
        // If exchange fails, it might be because code verifier is not in cookies
        // This happens when the OAuth was initiated from a different session
        // Redirect to preserved path and let client handle it
        console.error('Error exchanging code for session:', error);
        const redirectUrl = new URL(nextPath, requestUrl.origin);
        redirectUrl.searchParams.set('code', code); // Keep code for client-side exchange
        redirectUrl.searchParams.set('error', error?.message || 'server_exchange_failed');
        return NextResponse.redirect(redirectUrl);
      }
    } catch (error: any) {
      console.error('Exception in callback:', error);
      // On error, pass code to client for exchange
      const redirectUrl = new URL(nextPath, requestUrl.origin);
      redirectUrl.searchParams.set('code', code);
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
      console.log('[OAuth Callback] Session exists, redirecting to:', nextPath);
      return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
    }
  } catch (err) {
    console.error('[OAuth Callback] Error checking session:', err);
  }
  
  // No code, no error, no session - might be a direct visit to callback route
  // Just redirect to preserved path or home (don't show error, allow user to try again)
  console.log('[OAuth Callback] No code, no session - redirecting to:', nextPath);
  return NextResponse.redirect(new URL(nextPath, requestUrl.origin));
}
