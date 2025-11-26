'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { User as UserProfile } from '@/types';
import { logError } from './error-handler';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName: string, role: 'citizen' | 'agency') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Handle OAuth callback - server tries first, client handles if server fails
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const serverError = error === 'server_exchange_failed' || error === 'callback_error';
    
    // If server failed to exchange, try client-side (code verifier is in browser storage)
    if (code && serverError) {
      const exchangeCode = async () => {
        try {
          console.log('Server exchange failed, trying client-side exchange...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (!exchangeError && data.session) {
            console.log('Client-side OAuth exchange successful');
            // Clean up URL params but preserve pathname
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('code');
            newUrl.searchParams.delete('error');
            newUrl.searchParams.delete('error_description');
            newUrl.searchParams.delete('next');
            window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
            // Session will be picked up by auth state change listener
          } else {
            console.error('Client-side exchange also failed:', exchangeError);
            // Clean up URL anyway
            const newUrl = new URL(window.location.href);
            newUrl.searchParams.delete('code');
            newUrl.searchParams.set('error', 'oauth_failed');
            window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
          }
        } catch (err) {
          console.error('Exception in client-side exchange:', err);
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('code');
          newUrl.searchParams.set('error', 'oauth_exception');
          window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
        }
      };
      
      exchangeCode();
    } else if (code && !error) {
      // Code present but no error - server handled it successfully
      // Just clean up URL params but preserve pathname
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('code');
      newUrl.searchParams.delete('next');
      window.history.replaceState({}, '', newUrl.pathname + newUrl.search);
    } else if (error && !code) {
      // Error without code - handle errors
      if (error === 'access_denied') {
        console.warn('OAuth cancelled by user');
      } else if (error !== 'no_code') {
        console.error('OAuth error:', error, urlParams.get('error_description') || '');
      }
      // Clean up URL
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('error');
      newUrl.searchParams.delete('error_description');
      window.history.replaceState({}, '', newUrl.pathname);
    }

    // Check active session on mount
    const initializeAuth = async () => {
      try {
        // Small delay to let OAuth callback complete if needed
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setLoading(false);
          return;
        }

        console.log('Initial session check:', session?.user?.email || 'No session');
        
        if (session?.user) {
          setUser(session.user);
          await loadProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      setUser(session?.user ?? null);
      if (session?.user) {
        // Handle OAuth sign-in - ensure profile exists
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await loadProfile(session.user.id);
        } else {
          loadProfile(session.user.id);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      let { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      // Check if profile doesn't exist (common for new OAuth users)
      const isProfileNotFound = error && (
        error.code === 'PGRST116' || 
        error.code === '42P01' ||
        error.message?.includes('No rows') ||
        error.message?.includes('not found') ||
        error.message?.includes('does not exist')
      );

      if (isProfileNotFound) {
        // Profile doesn't exist - this is normal for new users
        // Try to create it, but don't fail if it doesn't work
        const { data: authUser } = await supabase.auth.getUser();
        
        if (authUser?.user) {
          const user = authUser.user;
          const fullName = 
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.user_metadata?.display_name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] || 
            'User';
          
          // Try to create profile (trigger should handle it, but this is a fallback)
          const { data: newProfile, error: insertError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: fullName,
              role: 'citizen',
            })
            .select()
            .single();

          if (!insertError && newProfile) {
            // Successfully created profile
            setProfile(newProfile);
            return;
          } else if (insertError) {
            // Insert failed - might be RLS or duplicate
            // Wait and try to load again (trigger might have created it)
            await new Promise(resolve => setTimeout(resolve, 1000));
            const { data: retryData, error: retryError } = await supabase
              .from('users')
              .select('*')
              .eq('id', userId)
              .single();
            
            if (!retryError && retryData) {
              // Profile was created, use it
              setProfile(retryData);
              return;
            }
            // If still no profile, continue without it (user is still authenticated)
          }
        }
        // No profile found and couldn't create - continue without profile
        setProfile(null);
        return;
      } else if (error) {
        // Real error (not just "not found")
        // Try to serialize error for better logging
        const errorDetails = {
          message: error?.message || String(error),
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
        };
        
        // Only log non-critical errors
        if (error.code !== 'PGRST116') {
          console.warn('[AuthContext.loadProfile] Error loading profile:', errorDetails);
        }
        // Don't throw - continue without profile
        setProfile(null);
        return;
      } else if (data) {
        // Profile found - use it
        setProfile(data);
        return;
      } else {
        // No data, no error - shouldn't happen but handle gracefully
        setProfile(null);
        return;
      }
    } catch (error: any) {
      // Catch any unexpected errors
      const errorInfo = {
        message: error?.message || String(error) || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        stack: error?.stack,
        name: error?.name,
      };
      
      // Only log if it's a real error (not just missing profile)
      if (errorInfo.code !== 'PGRST116') {
        console.warn('[AuthContext.loadProfile] Unexpected error:', errorInfo);
      }
      
      // Continue without profile - don't break authentication
      setProfile(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error };
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: 'citizen' | 'agency'
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role,
        },
      },
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    // Preserve current pathname so user returns to the same page after sign-in
    // Default to '/' if on auth callback page or root
    const currentPath = window.location.pathname;
    const nextPath = currentPath === '/auth/callback' || currentPath === '/' ? '/' : currentPath;
    
    // Use NEXT_PUBLIC_APP_URL if available (for production), otherwise use current origin
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
    const redirectTo = `${appUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`;
    
    console.log('[Sign In] Current path:', currentPath, '→ Redirecting to:', nextPath);
    console.log('[Sign In] Using app URL:', appUrl);
    
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        // Use PKCE flow - code verifier will be stored and retrieved automatically
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
      // Ensure PKCE flow is used (default for browser clients)
    });

    if (error) {
      console.error('Google sign-in error:', error);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

