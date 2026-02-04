import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, email, username } = await request.json();

    if (!userId || !email || !username) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Try to use service role key if available (bypasses RLS)
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
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

      // Check if profile exists
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
            email: email,
            full_name: username,
            role: 'citizen',
          });

        if (profileError && !profileError.message.includes('duplicate')) {
          console.error('Error creating profile with service role:', profileError);
          return NextResponse.json(
            { error: 'Failed to create profile: ' + profileError.message },
            { status: 500 }
          );
        }
      }

      return NextResponse.json({ success: true });
    }

    // Fallback: Use regular client (requires authenticated user)
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      }
    );

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized - user not authenticated' },
        { status: 401 }
      );
    }

    // Check if profile exists
    const { data: existingProfile } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (!existingProfile) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          full_name: username,
          role: 'citizen',
        });

      if (profileError && !profileError.message.includes('duplicate')) {
        console.error('Error creating profile:', profileError);
        return NextResponse.json(
          { error: 'Failed to create profile: ' + profileError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in create-profile:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

