# UrbanOS Setup Instructions

## Prerequisites

- Node.js 18+ installed
- Supabase account (https://supabase.com)

## Environment Setup

1. Create a `.env.local` file in the root directory with the following variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Social Media Integration (optional for initial setup)
INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
WHATSAPP_ACCESS_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
```

2. Get your Supabase credentials:
   - Go to https://supabase.com and create a new project
   - Go to Settings > API
   - Copy the Project URL and anon/public key
   - Update your `.env.local` file

## Database Setup

The database schema will be created automatically using Supabase migrations. See the `supabase/migrations` folder.

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Features

- **Report Issues**: Report civic issues like potholes, broken streetlights, etc.
- **Know Your Community**: See community officials and their responsibilities
- **Issue Predictor**: Predict potential issues on routes based on historical data
- **Cybersecurity Alerts**: Report and receive alerts about cyber threats
- **Social Media Integration**: Report issues via Instagram, WhatsApp, and Twitter

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS, Framer Motion
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **Maps**: Leaflet
- **UI**: Windows 11-inspired interface with parallax landing page

