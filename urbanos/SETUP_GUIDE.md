# UrbanOS Enhanced Reports System - Setup Guide

This guide will help you set up all the new features before using the website.

## 🗄️ Step 1: Run Database Migrations

You need to run all the new database migrations in order. Go to your Supabase project dashboard:

1. Open your Supabase project: https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run each migration file **in order** (they are numbered chronologically):

   - ✅ `20240101000000_initial_schema.sql` (should already be run)
   - ✅ `20240101000001_rls_policies.sql` (should already be run)
   - ✅ `20240101000002_seed_data.sql` (should already be run)
   - 🔴 **NEW:** `20240102000001_update_report_types.sql`
   - 🔴 **NEW:** `20240102000002_add_videos_to_reports.sql`
   - 🔴 **NEW:** `20240102000003_create_report_votes.sql`
   - 🔴 **NEW:** `20240102000004_create_e_signatures.sql`
   - 🔴 **NEW:** `20240102000005_create_community_reports.sql`
   - 🔴 **NEW:** `20240102000006_create_followups.sql`
   - 🔴 **NEW:** `20240102000007_create_pil_documents.sql`
   - 🔴 **NEW:** `20240102000008_create_video_storage.sql`
   - 🔴 **NEW:** `20240102000009_promote_community_report.sql`
   - 🔴 **NEW:** `20240102000010_auto_tag_authorities.sql`
   - 🔴 **NEW:** `20240102000011_rls_policies_new_tables.sql`
   - 🔴 **NEW:** `20240102000012_add_increment_email_opens_function.sql`

   **Tip:** Copy and paste the contents of each file into the SQL Editor and run them one by one.

## 📦 Step 2: Create Storage Buckets

Verify these storage buckets exist in your Supabase Storage:

1. Go to **Storage** in your Supabase dashboard
2. Ensure these buckets exist (some are created by migrations):
   - ✅ `report-images` (should already exist)
   - 🔴 **NEW:** `report-videos` (created by migration 20240102000008)
   - 🔴 **NEW:** `community-reports` (created by migration 20240102000012)

   If any bucket is missing, create it manually:
   - Click **New bucket**
   - Name: `report-videos` or `community-reports`
   - Make it **Public** (toggle ON)
   - Click **Create bucket**

## 🔑 Step 3: Configure Environment Variables

Update your `.env.local` file with the required API keys:

```env
# Supabase Configuration (you already have these)
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Email Service (Resend API) - REQUIRED for email functionality
RESEND_API_KEY=re_your_resend_api_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL (for email links and tracking)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production, use: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### How to get Resend API Key:

1. Go to https://resend.com
2. Sign up for a free account
3. Create an API key in the dashboard
4. Add it to your `.env.local` file

**Note:** The Resend API key is required for:
- Sending emails to authorities for community reports
- Follow-up email tracking
- PIL notifications

## 🧪 Step 4: Verify Database Tables

After running migrations, verify these new tables exist:

Go to **Table Editor** in Supabase and check for:
- ✅ `report_votes`
- ✅ `e_signatures`
- ✅ `community_reports`
- ✅ `community_report_followups`
- ✅ `pil_documents`

Also verify the `reports` table has these new columns:
- ✅ `videos` (TEXT[])
- ✅ `authority_ids` (UUID[])

## 🔍 Step 5: Test Database Functions

Verify the auto-promotion function works:

1. Go to **Database** → **Functions** in Supabase
2. Check that `promote_to_community_report()` function exists
3. Check that `increment_email_opens()` function exists

## 🎨 Step 6: Update Report Types (Optional)

If you want to seed agencies data for authority tagging:

1. Go to **Table Editor** → `agencies`
2. Add some agencies with proper `region` and `type` fields
3. Examples:
   - Name: "Municipal Corporation", Type: "Public Works", Region: "Downtown"
   - Name: "Traffic Police", Type: "Traffic Police", Region: "City"

The authority auto-tagging will match reports to agencies based on location and type.

## 🚀 Step 7: Start the Development Server

```bash
cd urbanos
npm run dev
```

Then open: http://localhost:3000

## ✅ Step 8: Test the Features

Test each new feature:

1. **Create Report with Videos:**
   - Go to Reports → Create
   - Select a new report type (Cyber, Road Safety, etc.)
   - Upload a video (optional)
   - Check that authorities are auto-tagged

2. **Vote on Reports:**
   - Click on any report
   - Try upvoting (you'll need to sign e-signature)
   - Check vote counts update

3. **Community Reports:**
   - Upvote a report 50+ times (or manually update DB for testing)
   - Check that it appears in "Community Reports" tab
   - Verify curator can generate document and send email

4. **E-Signatures:**
   - When upvoting, verify e-signature modal appears
   - Check consent form works
   - Verify signatures are stored in database

## 🐛 Troubleshooting

### Migration Errors

If you get errors running migrations:

1. **"Type already exists"** - This is fine, skip that line or use `IF NOT EXISTS`
2. **"Column already exists"** - The column was already added, skip it
3. **"Function already exists"** - Drop and recreate, or use `CREATE OR REPLACE FUNCTION`

### Email Not Sending

1. Verify `RESEND_API_KEY` is set correctly in `.env.local`
2. Check Resend dashboard for email logs
3. Verify `RESEND_FROM_EMAIL` is a verified domain in Resend

### Storage Bucket Issues

1. Make sure buckets are **public**
2. Check RLS policies are set correctly
3. Verify bucket names match exactly: `report-videos`, `community-reports`

### Authority Tagging Not Working

1. Check agencies table has data
2. Verify report location format matches agency region format
3. Check browser console for errors

## 📝 Next Steps

After setup:

1. **Production Deployment:**
   - Set `NEXT_PUBLIC_APP_URL` to your production domain
   - Configure Resend with your production email domain
   - Run migrations on production database

2. **Enhanced Features (Optional):**
   - Set up cron job for follow-up scheduler
   - Integrate proper PDF generation library (pdfkit/react-pdf)
   - Set up reverse geocoding for better authority tagging

3. **Testing:**
   - Test with multiple users
   - Test email delivery
   - Test community report promotion flow

---

**Need Help?** Check the migration files for detailed SQL comments or review the implementation in the components.

