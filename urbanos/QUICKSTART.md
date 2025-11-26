# UrbanOS Quick Start Guide

## Your Supabase Configuration

✅ **Project URL**: `https://iredygbhjgqcvekjlrrl.supabase.co`
✅ **Anon Key**: Already configured

## Setup Steps

### 1. Create Environment File (Choose One Method)

**Method A: Run Setup Script (Easiest)**
```bash
node setup-env.js
```

**Method B: Manual Setup**
Create a file named `.env.local` in the urbanos folder with this content:
```env
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
```

### 2. Set Up Database

Go to your Supabase project dashboard at:
👉 https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl

**Steps:**
1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Copy and paste the content from `supabase/migrations/20240101000000_initial_schema.sql`
4. Click **Run** (or press Ctrl/Cmd + Enter)
5. Repeat for:
   - `supabase/migrations/20240101000001_rls_policies.sql`
   - `supabase/migrations/20240101000002_seed_data.sql`

### 3. Verify Storage Bucket

1. In Supabase dashboard, go to **Storage**
2. You should see a bucket named `report-images`
3. If not, the migration will create it automatically when you run it

### 4. Start Development Server

```bash
npm run dev
```

### 5. Open Your Browser

Navigate to: **http://localhost:3000**

## What You'll See

### Landing Page (/)
- Beautiful parallax scrolling hero
- Animated feature showcases
- "Launch UrbanOS" button
- Sign In button (top right)

### OS Interface (/os)
- Windows 11-style taskbar at the bottom
- Click any icon to open an app
- Apps slide up from the taskbar

## First Steps

1. **Sign Up**: Click the Sign In button and create an account
2. **Explore**: Try each app from the taskbar:
   - 📋 **Reports** - Create a test report
   - 👥 **Community** - See sample community officials
   - 🗺️ **Predictor** - View risk zones map
   - 🛡️ **Security** - Report security incidents
   - 👤 **Profile** - Update your profile
   - 🔔 **Notifications** - See your notifications

## Sample Data Included

The seed data includes:
- 8 government agencies
- 8 community officials across different regions
- 10 historical incidents for the predictor

## Troubleshooting

### "Error connecting to Supabase"
- Check that you ran the setup script or created `.env.local`
- Verify the environment variables are correct
- Restart the dev server (`Ctrl+C` then `npm run dev`)

### "Database error"
- Make sure you ran all 3 migration files in Supabase SQL Editor
- Check the Supabase dashboard for any error messages

### "Map not loading"
- Maps require an internet connection for tiles
- Check your browser console for any errors

### "Images not uploading"
- Verify the `report-images` storage bucket exists in Supabase
- Check Storage policies were created by the migrations

## Need Help?

Check these files for more details:
- `README.md` - Complete documentation
- `SETUP.md` - Detailed setup guide
- `supabase/README.md` - Database documentation

## Quick Commands

```bash
# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

🎉 **You're all set! Enjoy building with UrbanOS!**

