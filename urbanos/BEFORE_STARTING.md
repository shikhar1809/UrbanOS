# 🚀 Before Starting the Website - Complete Checklist

## What You Need to Do Before Using the Enhanced Reports System

---

## 1️⃣ **Run Database Migrations** (MOST IMPORTANT - ~20 minutes)

You have **12 new migration files** that need to be run in Supabase:

### Steps:
1. Go to: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the sidebar
4. Run each file **in this exact order** (copy-paste the entire file content):

```
📄 20240102000001_update_report_types.sql
📄 20240102000002_add_videos_to_reports.sql
📄 20240102000003_create_report_votes.sql
📄 20240102000004_create_e_signatures.sql
📄 20240102000005_create_community_reports.sql
📄 20240102000006_create_followups.sql
📄 20240102000007_create_pil_documents.sql
📄 20240102000008_create_video_storage.sql
📄 20240102000009_promote_community_report.sql
📄 20240102000010_auto_tag_authorities.sql
📄 20240102000011_rls_policies_new_tables.sql
📄 20240102000012_add_increment_email_opens_function.sql
```

**Location:** All files are in `urbanos/supabase/migrations/`

**Tip:** If you see errors like "already exists", that's okay - it means some parts were already created. You can ignore those or use `IF NOT EXISTS` clauses.

---

## 2️⃣ **Create Storage Buckets** (~2 minutes)

Go to Supabase → **Storage** → Create these buckets if they don't exist:

1. **`report-videos`** 
   - Make it **Public** ✓
   - This stores video uploads from reports

2. **`community-reports`**
   - Make it **Public** ✓
   - This stores generated PDF documents

**Note:** The migrations should create these automatically, but verify they exist.

---

## 3️⃣ **Add Environment Variables** (~5 minutes)

Open `urbanos/.env.local` and add these **NEW** variables:

```env
# Email Service (REQUIRED for email features)
# Get your key from: https://resend.com
RESEND_API_KEY=re_your_api_key_here

# Email sender address (use your verified domain in Resend)
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL (for email links and tracking pixels)
NEXT_PUBLIC_APP_URL=http://localhost:3000
# For production: NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### How to Get Resend API Key:
1. Go to https://resend.com
2. Sign up (free account)
3. Go to **API Keys** in dashboard
4. Create new API key
5. Copy it to `.env.local` as `RESEND_API_KEY`

**Why needed?** Email service is required for:
- Sending community reports to authorities
- Follow-up emails
- PIL filing notifications

---

## 4️⃣ **Verify Database Changes** (~3 minutes)

After running migrations, verify these exist:

### In Supabase → Table Editor:
- ✅ `report_votes` table exists
- ✅ `e_signatures` table exists  
- ✅ `community_reports` table exists
- ✅ `community_report_followups` table exists
- ✅ `pil_documents` table exists

### In `reports` table, check columns:
- ✅ `videos` column (TEXT[])
- ✅ `authority_ids` column (UUID[])

### In Supabase → Database → Functions:
- ✅ `promote_to_community_report()` function exists
- ✅ `increment_email_opens()` function exists

---

## 5️⃣ **Restart Development Server** (~1 minute)

After making changes:

```bash
# Stop current server (Ctrl+C)
# Then restart:
cd urbanos
npm run dev
```

---

## 6️⃣ **Quick Test** (~5 minutes)

Test that everything works:

1. **Create Report:**
   - Go to Reports → Create
   - Try selecting a new report type (Cyber, Road Safety, etc.)
   - Upload a video (optional)
   - Submit

2. **Vote on Report:**
   - Open any report
   - Click upvote button
   - E-signature modal should appear
   - Complete signature and verify vote counts

3. **Check Community Reports:**
   - Go to Reports → Community Reports tab
   - Should load (even if empty initially)

---

## ⚠️ Troubleshooting

### Migration Errors:
- **"relation already exists"** → That table already exists, skip that part
- **"type already exists"** → The enum value was already added
- **"function already exists"** → Use `CREATE OR REPLACE FUNCTION` instead

### Email Not Working:
- ✅ Check `RESEND_API_KEY` is set correctly
- ✅ Verify domain is verified in Resend dashboard
- ✅ Check browser console for errors
- ✅ Check Resend dashboard for email logs

### Storage Issues:
- ✅ Make sure buckets are **Public**
- ✅ Check bucket names match exactly
- ✅ Verify RLS policies allow access

### Authority Tagging Not Working:
- ✅ Add some agencies in `agencies` table
- ✅ Make sure agencies have `region` and `type` fields populated
- ✅ Check browser console for errors

---

## ✅ Final Checklist

Before starting:
- [ ] All 12 migrations run successfully
- [ ] Storage buckets created (report-videos, community-reports)
- [ ] Environment variables added (RESEND_API_KEY, etc.)
- [ ] All new tables verified in Supabase
- [ ] Server restarted
- [ ] Quick test completed

---

## 📚 Additional Resources

- **Detailed Setup Guide:** See `SETUP_GUIDE.md`
- **Quick Reference:** See `QUICK_SETUP.md`
- **Migration Files:** `urbanos/supabase/migrations/`

---

## 🎉 Ready to Go!

Once all steps are complete, your enhanced reports system is ready to use with:
- ✅ Community voting with e-signatures
- ✅ Video uploads
- ✅ Authority auto-tagging
- ✅ Community reports (50+ upvotes)
- ✅ Document generation
- ✅ Email notifications
- ✅ Follow-up tracking
- ✅ PIL filing

**Start your server:** `npm run dev` 🚀

