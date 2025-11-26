# IMMEDIATE FIX: Reports Not Displaying on Map

## Problem
Reports are not displaying on the map. The query may be failing due to RLS policies or the query not executing.

## Solution Steps

### Step 1: Run This SQL in Supabase (CRITICAL)

Go to Supabase Dashboard → SQL Editor and run this:

```sql
-- Step 1: Drop ALL existing SELECT policies on reports
DROP POLICY IF EXISTS "Public can view non-anonymous reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
DROP POLICY IF EXISTS "Users can view reports" ON public.reports;
DROP POLICY IF EXISTS "Public can view all reports" ON public.reports;

-- Step 2: Create a single policy that allows EVERYONE to view ALL reports
CREATE POLICY "Public can view all reports"
  ON public.reports FOR SELECT
  USING (true);

-- Step 3: Verify the policy was created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'reports' AND cmd = 'SELECT';
```

### Step 2: Verify Reports Exist

Run this query to check if reports exist:

```sql
SELECT 
  COUNT(*) as total_reports,
  COUNT(*) FILTER (WHERE location IS NOT NULL) as reports_with_location,
  COUNT(*) FILTER (WHERE is_anonymous = true) as anonymous_reports,
  COUNT(*) FILTER (WHERE is_anonymous = false) as non_anonymous_reports
FROM public.reports;
```

If `total_reports` is 0, you need to create some reports first.

### Step 3: Test the Query Directly

Run this to test if the query works:

```sql
SELECT id, title, type, location, created_at 
FROM public.reports 
ORDER BY created_at DESC 
LIMIT 10;
```

### Step 4: Check Browser Console

1. Open http://localhost:3000/os
2. Open DevTools (F12) → Console
3. Look for:
   - `🔍 Starting report query...` - Query is starting
   - `📊 Reports loaded from DB: X reports` - Query succeeded
   - `❌ Error loading reports` - Query failed (check error details)

### Step 5: If Still Not Working

If reports still don't show after running the SQL:

1. **Check Network Tab**: Look for requests to `*.supabase.co/rest/v1/reports`
   - If no request: Query isn't executing (check console for errors)
   - If 401/403: Authentication/RLS issue
   - If 200 but empty: No reports in database

2. **Create a Test Report**: Use the UI to create a report and see if it appears

3. **Check Environment Variables**: Ensure `.env.local` has:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   ```

## Quick Test

After running the SQL, refresh the page and check the console. You should see:
- `📊 Reports loaded from DB: X reports`
- `✅✅✅ RENDERING X REPORT MARKERS ON MAP`

If you see these messages, reports should appear on the map!

