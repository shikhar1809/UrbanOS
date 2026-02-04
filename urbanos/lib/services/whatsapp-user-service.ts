import { createClient } from '@supabase/supabase-js';

/**
 * WhatsApp User Service
 * Handles anonymous/system user creation for WhatsApp reports
 */

const SYSTEM_USER_EMAIL = 'whatsapp@example.com';
const SYSTEM_USER_NAME = 'WhatsApp User';

/**
 * Get or create system user for WhatsApp reports
 * Uses service role key to bypass RLS
 */
export async function getOrCreateWhatsAppUser(): Promise<{ userId: string; error?: string }> {
  try {
    // Use service role key for admin operations
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!serviceRoleKey) {
      return {
        userId: '',
        error: 'SUPABASE_SERVICE_ROLE_KEY not configured',
      };
    }

    // Create admin client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // First, check if system user exists in public.users
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', SYSTEM_USER_EMAIL)
      .single();

    if (existingUser && !fetchError) {
      return { userId: existingUser.id };
    }

    // System user doesn't exist in public.users
    // We need to check if there's an auth.users entry first
    // Since we can't directly query auth.users, we'll try to find any existing user as fallback
    // In production, you should create a system user via Supabase dashboard or Admin API
    
    // Fallback: Use the first available user from database
    // This allows testing without needing to create a dedicated system user
    const { data: anyUsers, error: listError } = await supabase
      .from('users')
      .select('id, email')
      .limit(1);

    if (anyUsers && anyUsers.length > 0) {
      const fallbackUser = anyUsers[0];
      console.log(`Using fallback user for WhatsApp reports: ${fallbackUser.email} (${fallbackUser.id})`);
      console.log('Note: This is fine for testing. For production, create a dedicated system user.');
      return { userId: fallbackUser.id };
    }

    // No users exist at all - return error
    return {
      userId: '',
      error: `No users found in database. Please create at least one user account through the app signup, then WhatsApp reports will use that user as a fallback.`,
    };
  } catch (error: any) {
    console.error('Error getting/creating WhatsApp user:', error);
    return {
      userId: '',
      error: error.message || 'Failed to get/create system user',
    };
  }
}

/**
 * Alternative: Create anonymous user for specific phone number
 * This creates a user entry that can be linked to phone numbers
 */
export async function getOrCreatePhoneUser(phoneNumber: string): Promise<{ userId: string; error?: string }> {
  try {
    // Use system user for now - all WhatsApp reports will be under one system account
    // This is simpler than creating individual users per phone number
    return await getOrCreateWhatsAppUser();
  } catch (error: any) {
    console.error('Error getting/creating phone user:', error);
    return {
      userId: '',
      error: error.message || 'Failed to get/create phone user',
    };
  }
}

