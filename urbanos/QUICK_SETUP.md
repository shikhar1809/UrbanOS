# Quick Setup Checklist ⚡

Before using the website, complete these steps:

## ✅ Pre-Launch Checklist

### 1. Database Migrations (15-20 minutes)
- [ ] Go to Supabase Dashboard → SQL Editor
- [ ] Run these migrations **in order** (copy-paste each file):
  1. `20240102000001_update_report_types.sql`
  2. `20240102000002_add_videos_to_reports.sql`
  3. `20240102000003_create_report_votes.sql`
  4. `20240102000004_create_e_signatures.sql`
  5. `20240102000005_create_community_reports.sql`
  6. `20240102000006_create_followups.sql`
  7. `20240102000007_create_pil_documents.sql`
  8. `20240102000008_create_video_storage.sql`
  9. `20240102000009_promote_community_report.sql`
  10. `20240102000010_auto_tag_authorities.sql`
  11. `20240102000011_rls_policies_new_tables.sql`
  12. `20240102000012_add_increment_email_opens_function.sql`

### 2. Storage Buckets (2 minutes)
- [ ] Go to Supabase → Storage
- [ ] Verify/create these buckets (make them **Public**):
  - [ ] `report-videos`
  - [ ] `community-reports`

### 3. Environment Variables (5 minutes)
- [ ] Open `urbanos/.env.local`
- [ ] Add these new variables:

```env
# Email Service (Required for email features)
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=noreply@yourdomain.com

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Get Resend API Key:**
1. Sign up at https://resend.com
2. Create API key in dashboard
3. Copy to `.env.local`

### 4. Verify Setup (3 minutes)
- [ ] Check Tables exist: `report_votes`, `e_signatures`, `community_reports`, etc.
- [ ] Check `reports` table has `videos` and `authority_ids` columns
- [ ] Restart dev server: `npm run dev`

### 5. Test Features (5 minutes)
- [ ] Create a report with a video
- [ ] Vote on a report (test e-signature)
- [ ] Check authority auto-tagging works

## 🚨 Common Issues

**Migration Errors?**
- If "already exists" → Skip that statement or use `IF NOT EXISTS`
- If function exists → Use `CREATE OR REPLACE FUNCTION`

**Email Not Working?**
- Check `RESEND_API_KEY` in `.env.local`
- Verify email domain in Resend dashboard

**Storage Issues?**
- Make buckets **Public**
- Check bucket names are exact

---

**Ready?** Start your server: `npm run dev` 🚀

