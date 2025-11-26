# 🚨 URGENT: Fix Reports Not Displaying on Map

## The Problem
Reports are not showing on the map at https://urbanos-rho.vercel.app/os

## Root Cause
**RLS (Row Level Security) policies in Supabase are blocking public access to reports.**

## ⚡ IMMEDIATE FIX (5 minutes)

### Step 1: Go to Supabase Dashboard
1. Visit: https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Copy and Paste This SQL

```sql
-- Fix: Allow public viewing of ALL reports
-- This will make reports visible on the map

-- Step 1: Drop all existing SELECT policies
DROP POLICY IF EXISTS "Public can view non-anonymous reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view reports" ON public.reports;
DROP POLICY IF EXISTS "Public can view all reports" ON public.reports;

-- Step 2: Create a policy that allows EVERYONE to view ALL reports
CREATE POLICY "Public can view all reports"
  ON public.reports FOR SELECT
  USING (true);
```

### Step 3: Run the Query
1. Click **Run** (or press Ctrl/Cmd + Enter)
2. You should see: "Success. No rows returned"

### Step 4: Verify It Worked
Run this test query:

```sql
-- Test: This should return the count of all reports
SELECT COUNT(*) as total_reports FROM public.reports;
```

If you see a number (even 0), the policy is working!

### Step 5: Refresh Your Site
1. Go to: https://urbanos-rho.vercel.app/os
2. Open browser DevTools (F12) → Console
3. Look for: `📊 Reports loaded from DB: X reports`
4. Reports should now appear on the map!

---

## If Still Not Working

### Check 1: Do Reports Exist?
Run in Supabase SQL Editor:
```sql
SELECT id, title, type, location, created_at 
FROM public.reports 
ORDER BY created_at DESC 
LIMIT 10;
```

**If this returns 0 rows:**
- No reports exist in the database
- Create a test report via the UI: https://urbanos-rho.vercel.app/os → Click "Report" → Create a report

### Check 2: Verify RLS Policy
Run in Supabase SQL Editor:
```sql
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reports' AND cmd = 'SELECT';
```

**You should see:**
- A policy named "Public can view all reports"
- `qual` should be `true` or empty

### Check 3: Browser Console
1. Open: https://urbanos-rho.vercel.app/os
2. Press F12 → Console tab
3. Look for error messages starting with `❌` or `⚠️`
4. Share the error message if you see one

---

## Quick Test After Fix

1. ✅ Run the SQL migration above
2. ✅ Refresh the page
3. ✅ Check console for: `📊 Reports loaded from DB: X reports`
4. ✅ Reports should appear as colored markers on the map

---

## Why This Happens

Supabase uses Row Level Security (RLS) to protect data. The original policy only allowed:
- Users to see their own reports
- Agencies/admins to see all reports

But it **blocked public/unauthenticated users** from seeing any reports, which is why the map was empty.

The fix creates a policy that allows **everyone** (authenticated and unauthenticated) to view **all** reports, which is what we want for the public map.

---

## Need Help?

If reports still don't show after running the SQL:
1. Check browser console for errors
2. Verify reports exist in database (run the SELECT query above)
3. Make sure you ran the DROP and CREATE statements (both are needed)

