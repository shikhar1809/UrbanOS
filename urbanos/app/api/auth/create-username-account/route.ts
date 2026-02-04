import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { username } = await request.json();

    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { error: 'Username must be at least 3 characters' },
        { status: 400 }
      );
    }

    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('SUPABASE_SERVICE_ROLE_KEY is not set in environment variables');
      return NextResponse.json(
        { 
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required. Please set it in Vercel environment variables.',
          details: 'This key is needed to create accounts without email confirmation.'
        },
        { status: 500 }
      );
    }

    // Use service role to bypass RLS and email confirmation
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const sanitizedUsername = username.toLowerCase().replace(/[^a-z0-9]/g, '');
    const email = `${sanitizedUsername}@example.com`;
    const password = `urbanos_${Math.random().toString(36).slice(2, 15)}${Math.random().toString(36).slice(2, 15)}`;

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.user_metadata?.username === username || u.email === email
    );

    let userId: string;
    let userEmail: string;

    if (existingUser) {
      // User exists, use their ID
      userId = existingUser.id;
      userEmail = existingUser.email || email;
      
      // Update metadata if needed
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          full_name: username,
          username: username,
        },
      });
    } else {
      // Create new user with admin API (bypasses email confirmation)
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: username,
          username: username,
        },
      });

      if (createError || !newUser.user) {
        console.error('Error creating user:', createError);
        return NextResponse.json(
          { error: createError?.message || 'Failed to create account' },
          { status: 500 }
        );
      }

      userId = newUser.user.id;
      userEmail = newUser.user.email || email;
    }

    // Ensure profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin
        .from('users')
        .insert({
          id: userId,
          email: userEmail,
          full_name: username,
          role: 'citizen',
        });

      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { error: 'Account created but profile creation failed: ' + profileError.message },
          { status: 500 }
        );
      }
    }

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: userEmail,
    });

    // Return user info - client will sign in with password
    return NextResponse.json({
      success: true,
      userId,
      email: userEmail,
      password, // Return password so client can sign in
      username,
    });
  } catch (error: any) {
    console.error('Error in create-username-account:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

