# WhatsApp System User Setup Guide

This guide will help you create the system user required for WhatsApp reports.

## Option 1: Using Supabase Dashboard (Recommended)

### Step 1: Create Auth User

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"** or **"Create New User"**
4. Fill in the following:
   - **Email**: `whatsapp@urbanos.local`
   - **Password**: Generate a secure random password (you won't need it, but it's required)
   - **Auto Confirm User**: ✅ Check this box
5. Click **"Create User"**
6. **Copy the User ID (UUID)** - you'll need this in the next step

### Step 2: Create User Profile

1. Go to **SQL Editor** in Supabase Dashboard
2. Run this query, replacing `YOUR_USER_ID_HERE` with the UUID you copied:

```sql
-- Replace YOUR_USER_ID_HERE with the actual UUID from Step 1
INSERT INTO public.users (id, email, full_name, role)
VALUES ('YOUR_USER_ID_HERE', 'whatsapp@urbanos.local', 'WhatsApp User', 'citizen')
ON CONFLICT (id) DO NOTHING;
```

**Example:**
```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES ('123e4567-e89b-12d3-a456-426614174000', 'whatsapp@urbanos.local', 'WhatsApp User', 'citizen')
ON CONFLICT (id) DO NOTHING;
```

### Step 3: Verify User Created

Run this query to verify the user was created:

```sql
SELECT id, email, full_name, role 
FROM public.users 
WHERE email = 'whatsapp@urbanos.local';
```

You should see the user profile with the UUID you created.

---

## Option 2: Using SQL Helper Function

If you've already created the auth user:

1. Get the User ID from **Authentication** → **Users** → Find `whatsapp@urbanos.local` → Copy UUID
2. Go to **SQL Editor** and run:

```sql
-- Replace YOUR_USER_ID_HERE with the actual UUID
SELECT * FROM create_whatsapp_system_user('YOUR_USER_ID_HERE');
```

---

## Option 3: Temporary Workaround (For Testing)

If you just want to test the feature quickly, you can use any existing user:

1. Get any existing user ID from your database:

```sql
SELECT id, email FROM public.users LIMIT 1;
```

2. The system will automatically use the first available user as a fallback if the system user doesn't exist.

**Note**: This is only for testing. Create a dedicated system user for production.

---

## Troubleshooting

### Error: "invalid input syntax for type uuid"
- Make sure you're using a valid UUID format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- Don't include the `<` and `>` brackets or placeholder text
- Example: `'123e4567-e89b-12d3-a456-426614174000'` ✅
- Not: `'<user-id-from-auth>'` ❌

### Error: "duplicate key value violates unique constraint"
- The user already exists. This is fine - you can proceed.

### Error: "violates foreign key constraint"
- The UUID you're using doesn't exist in `auth.users`
- Make sure you created the auth user first (Step 1 of Option 1)

---

## Verify Setup

After completing the setup, test that the system user exists:

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM public.users
WHERE email = 'whatsapp@urbanos.local';
```

If you see a row returned, you're all set! 🎉

