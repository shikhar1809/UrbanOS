# Debugging Reports Not Displaying on Map

## Step 1: Run the Migration

The migration `20240103000001_fix_public_view_all_reports.sql` needs to be run in Supabase:

1. Go to your Supabase dashboard
2. Open SQL Editor
3. Copy and paste the contents of `urbanos/supabase/migrations/20240103000001_fix_public_view_all_reports.sql`
4. Click "Run" (or press Ctrl/Cmd + Enter)

## Step 2: Check Browser Console

Open your browser's Developer Tools (F12) and look for:

- `📊 Reports loaded from DB: X reports` - Shows how many reports were loaded
- `✅ Reports after filtering: X valid reports` - Shows how many passed validation
- `✅✅✅ RENDERING X REPORT MARKERS ON MAP` - Confirms markers are being rendered
- Any error messages starting with `❌` or `⚠️`

## Step 3: Verify Reports Exist in Database

Run this query in Supabase SQL Editor:

```sql
SELECT 
  id, 
  title, 
  type, 
  is_anonymous,
  location->>'lat' as lat,
  location->>'lng' as lng,
  created_at
FROM public.reports 
ORDER BY created_at DESC 
LIMIT 10;
```

If no results:
- There are no reports in the database
- Create a test report via the UI

If results exist but location is NULL:
- Reports exist but have invalid location data
- They will be filtered out by the validation

## Step 4: Test RLS Policies

Run this query as an unauthenticated user (make sure you're not logged in):

```sql
-- This should return all reports if RLS is working correctly
SELECT COUNT(*) FROM public.reports;
```

If this returns 0 or errors:
- RLS policies are blocking access
- Run the migration again or check for conflicting policies

## Step 5: Check Map View Settings

In the browser console, look for:
- `🗺️ Report rendering check:` - Shows current view settings
- `🚫 Hiding report markers` - Indicates markers are being hidden by view logic

Common issues:
- View is set to "pollution" mode → Reports are hidden (switch to "all_alerts")
- Map mode is set to "heatmap" → Individual markers are hidden (switch to "reports")

## Step 6: Verify Supabase Connection

In the browser console Network tab:
- Look for requests to `*.supabase.co/rest/v1/reports`
- Check if the response contains data
- Check if there are any 401/403 errors (authentication/authorization issues)

## Quick Fix Checklist

✅ Run migration `20240103000001_fix_public_view_all_reports.sql`
✅ Verify reports exist in database
✅ Check browser console for errors
✅ Ensure view is set to "all_alerts" (not "pollution")
✅ Ensure map mode is "reports" (not "heatmap")
✅ Check that reports have valid location data (lat/lng)

