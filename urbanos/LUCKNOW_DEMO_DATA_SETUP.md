# Lucknow Demo Data Setup Guide

This guide will help you set up demo reports and community data for testing the UrbanOS application with realistic Lucknow city data.

## What's Included

- **10 Lucknow-specific agencies** (Municipal Corporation, PWD, LESA, etc.)
- **10 Community officials** with real Indian names and roles
- **12 Historical incidents** for the predictor algorithm
- **Function to create 10 demo reports** with real Lucknow locations and issues

## Setup Steps

### 1. Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open and run: `supabase/migrations/20240102000022_lucknow_demo_data.sql`
4. This will create:
   - Lucknow agencies
   - Community officials
   - Historical incidents
   - A function to create demo reports

### 2. Create Demo Reports

After running the migration, you need to create demo reports. You have two options:

#### Option A: Using Your Own User Account (Recommended)

1. Sign in to the UrbanOS application with your account
2. Go to Supabase SQL Editor
3. Run this query (replace `your-email@example.com` with your actual email):

```sql
-- Get your user ID and create demo reports
SELECT create_demo_reports_for_user(
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1)
);
```

#### Option B: Create a Test User First

1. In Supabase, go to **Authentication** → **Users**
2. Click **Add User** → **Create new user**
3. Create a test user (e.g., `demo@lucknow.test`)
4. Then run in SQL Editor:

```sql
SELECT create_demo_reports_for_user(
  (SELECT id FROM auth.users WHERE email = 'demo@lucknow.test' LIMIT 1)
);
```

### 3. Verify the Data

After running the queries, you should see:

- **Agencies**: 8 Lucknow-specific agencies in the agencies table
- **Community Officials**: 10 officials with Indian names
- **Reports**: 10 demo reports with various statuses (submitted, received, in-progress, resolved)
- **Historical Incidents**: 12 incidents for the predictor

## Demo Reports Created

The function creates 10 realistic reports:

1. **Pothole in Hazratganj** (in-progress, high priority)
2. **Streetlight issue in Gomti Nagar** (received, medium priority)
3. **Garbage in Aminabad** (submitted, high priority)
4. **Animal carcass in Indira Nagar** (submitted, high priority)
5. **Pothole in Alambagh** (resolved)
6. **Streetlight in Hazratganj** (received, low priority)
7. **Garbage in Gomti Nagar** (submitted, medium priority)
8. **Animal carcass on highway** (submitted, high priority)
9. **Resolved pothole** (resolved, for testing)
10. **Road safety hazard** (in-progress, high priority)

## Real Locations Used

All reports use actual Lucknow locations:
- **Hazratganj**: 26.8467°N, 80.9462°E
- **Gomti Nagar**: 26.8606°N, 80.9889°E
- **Alambagh**: 26.8381°N, 80.9236°E
- **Aminabad**: 26.8500°N, 80.9500°E
- **Indira Nagar**: 26.8700°N, 80.9800°E

## Community Officials

The migration creates officials with real Indian names:
- Rajesh Kumar Singh (Municipal Commissioner)
- Priya Sharma (Ward Councilor - Hazratganj)
- Amit Kumar Verma (Ward Councilor - Gomti Nagar)
- Sunita Devi (Ward Councilor - Alambagh)
- Vikram Singh (Ward Councilor - Aminabad)
- Anjali Tripathi (Ward Councilor - Indira Nagar)
- And more...

## Testing Features

With this demo data, you can test:

✅ **Report Creation** - See various report types
✅ **Report Status** - Different statuses (submitted, received, in-progress, resolved)
✅ **Voting System** - Vote on reports
✅ **Community Reports** - Reports with upvotes
✅ **Community Officials** - Browse officials by region
✅ **Issue Predictor** - See risk zones based on historical data
✅ **Agency Dashboard** - View assigned reports
✅ **Notifications** - Status update notifications

## Troubleshooting

### Reports not showing up?
- Make sure you ran the function with the correct user_id
- Check that the user exists in `auth.users` table
- Verify the reports were created: `SELECT * FROM public.reports;`

### Want to create more reports?
- Run the function again with a different user_id
- Or manually create reports through the UI

### Want to reset demo data?
```sql
-- Delete all demo reports (be careful!)
DELETE FROM public.reports WHERE user_id = (SELECT id FROM auth.users WHERE email = 'your-email@example.com');

-- Then run the function again
SELECT create_demo_reports_for_user(
  (SELECT id FROM auth.users WHERE email = 'your-email@example.com' LIMIT 1)
);
```

## Next Steps

1. ✅ Run the migration
2. ✅ Create demo reports using the function
3. ✅ Sign in to UrbanOS and explore the reports
4. ✅ Test voting, community reports, and other features
5. ✅ Check the predictor map with historical incidents

Enjoy testing! 🎉

