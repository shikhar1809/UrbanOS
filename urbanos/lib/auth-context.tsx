'use client';

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'citizen' | 'agency' | 'admin';
  region?: string | null;
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  signInWithUsername: (username: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const userRef = useRef<User | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const loadProfile = async (userId: string) => {
    try {
      console.log('[Profile] Loading profile for user:', userId);
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('[Profile] Error loading profile:', error);
        // If profile doesn't exist (PGRST116), try to create it
        if (error.code === 'PGRST116') {
          console.log('[Profile] Profile not found, will be created by ensureProfileExists');
          // Don't set profile to null, let ensureProfileExists handle it
          return;
        }
        setProfile(null);
        return;
      }

      if (data) {
        console.log('[Profile] Profile loaded successfully:', data.full_name || data.email);
        setProfile(data);
      } else {
        console.log('[Profile] No profile data returned');
        setProfile(null);
      }
    } catch (error) {
      console.error('[Profile] Exception loading profile:', error);
      setProfile(null);
    }
  };

  // Helper to ensure profile exists (uses API route which handles RLS)
  const ensureProfileExists = async (userId: string, email: string, username: string) => {
    try {
      // First check if profile already exists
      const { data: existingProfile } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('[Profile] Profile already exists');
        setProfile(existingProfile);
        return;
      }

      // Profile doesn't exist, create it via API route
      const response = await fetch('/api/auth/create-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, email, username }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        // If API route fails, wait a bit and check again (trigger might have created it)
        await new Promise(resolve => setTimeout(resolve, 2000));
        const { data: retryProfile } = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (retryProfile) {
          console.log('[Profile] Profile exists after retry (created by trigger)');
          setProfile(retryProfile);
          return;
        }
        
        console.error('[Profile] API route failed:', data.error);
        // Don't throw, try direct insert as last resort
      } else {
        console.log('[Profile] Profile created via API');
      }
      
      // Reload profile after creation
      await new Promise(resolve => setTimeout(resolve, 1000));
      await loadProfile(userId);
    } catch (error: any) {
      console.error('[Profile] Error ensuring profile exists:', error);
      // Try to load profile anyway (might exist now)
      await loadProfile(userId);
    }
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);

      // Get initial session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
      }

      if (session?.user) {
        // Set user immediately - don't wait for profile
        setUser(session.user);
        userRef.current = session.user;
        setLoading(false); // Set loading to false immediately
        // Load profile in background
        loadProfile(session.user.id).then(() => {
          // If profile didn't load, ensure it exists
            setTimeout(async () => {
            if (!profile) {
              const email = session.user.email || '';
              const username = session.user.user_metadata?.username || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
              await ensureProfileExists(session.user.id, email, username);
            }
          }, 1000);
        });
      } else {
        // No session - user needs to sign in manually
        setUser(null);
        userRef.current = null;
        setProfile(null);
        setLoading(false);
      }
    } catch (error) {
      console.error('Exception in initializeAuth:', error);
      setLoading(false);
      setUser(null);
      userRef.current = null;
      setProfile(null);
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event, session?.user?.id);

      if (session?.user) {
        const currentUser = session.user;
        setUser(currentUser);
        userRef.current = currentUser;
        await loadProfile(currentUser.id);
      } else {
        // User signed out - clear user state
        setUser(null);
        userRef.current = null;
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  };

  useEffect(() => {
    const cleanup = initializeAuth();
    return () => {
      cleanup.then((unsub) => unsub?.());
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    if (data.user) {
      setUser(data.user);
      await loadProfile(data.user.id);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
    if (data.user) {
      setUser(data.user);
      // Profile will be created by trigger, but we can try to load it
      if (data.session) {
        await loadProfile(data.user.id);
      }
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      throw error;
    }
    // Clear user state
    setUser(null);
    userRef.current = null;
    setProfile(null);
  };

  const signInWithUsername = async (username: string) => {
    try {
      console.log('[Sign In] Creating account for username:', username);
      
      const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
      const email = `${sanitizedUsername}_${Date.now()}@example.com`;
      const password = `urbanos_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`;

      // Step 1: Create account via Supabase signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: username,
            username: username,
          },
        },
      });

      // Handle signup errors - but check if user was created anyway
      if (signUpError) {
        console.error('[Sign In] Sign up error:', signUpError);
        
        // If it's a database error, the user might have been created anyway
        // Try to sign in to check
        if (signUpError.message?.includes('Database error')) {
          console.log('[Sign In] Database error detected, waiting and retrying sign-in...');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const { data: retrySignIn, error: retryError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (retrySignIn?.user) {
            console.log('[Sign In] User exists, sign-in successful after retry');
            const userId = retrySignIn.user.id;
            await ensureProfileExists(userId, email, username);
            console.log('[Sign In] Sign-in complete');
            return;
          }
        }
        
        throw new Error('Failed to create account: ' + signUpError.message);
      }

      if (!signUpData?.user?.id) {
        throw new Error('Account creation failed - no user ID returned');
      }

      const userId = signUpData.user.id;
      console.log('[Sign In] Account created, user ID:', userId);

      // Step 2: Wait for trigger to create profile (trigger runs automatically)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Step 3: If we have a session, verify profile and we're done
      if (signUpData?.session) {
        console.log('[Sign In] Session available, verifying profile...');
        await ensureProfileExists(userId, email, username);
        console.log('[Sign In] Sign-in complete');
        return;
      }

      // Step 4: No session, sign in to get session
      console.log('[Sign In] No session, signing in...');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.message.includes('Email not confirmed') || 
            signInError.message.includes('email_not_confirmed')) {
          throw new Error('Account created! Please disable email confirmation in Supabase settings, or check your email to confirm.');
        }
        throw new Error('Account created but sign-in failed: ' + signInError.message);
      }

      if (signInData?.user?.id) {
        console.log('[Sign In] Signed in successfully, verifying profile...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        await ensureProfileExists(signInData.user.id, email, username);
        console.log('[Sign In] Sign-in complete');
      }
    } catch (error: any) {
      console.error('[Sign In] Error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('[Auth] Initiating Google sign-in...');
      
      // Get the current origin for redirect URL
      const redirectUrl = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/callback`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        console.error('[Auth] Google sign-in error:', error);
        throw error;
      }

      // The redirect will happen automatically
      // User will be redirected to Google, then back to /auth/callback
      console.log('[Auth] Redirecting to Google...');
    } catch (error: any) {
      console.error('[Auth] Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithUsername,
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
