# UrbanOS - Your City, Your Voice

A full-stack civic engagement platform with parallax scrolling landing page and Windows 11-inspired interface, empowering citizens to report issues, connect with community leaders, and make cities safer through community-driven initiatives.

## Features

### 🎨 Landing Page
- **Parallax scrolling effects** inspired by chainzoku.io
- Animated gradient backgrounds with floating elements
- Feature showcases for all platform capabilities
- Call-to-action sections with statistics
- Smooth scroll animations using Framer Motion

### 🖥️ Windows 11-Style OS Interface
- **Taskbar** with centered app icons
- **Fullscreen sliding app windows** with spring animations
- **Glass effect** backdrop with blur
- **Real-time clock** and system tray
- Notification badges on app icons

### 📋 Core Applications

#### 1. Report Issues
- Multi-type issue reporting (pothole, streetlight, garbage, cybersecurity, other)
- **Image upload** with preview (up to 5 images)
- **Interactive map** location picker using Leaflet
- **Real-time status tracking** with Supabase subscriptions
- Agency dashboard for managing reports
- Automatic agency assignment based on region
- Response time tracking

#### 2. Know Your Community
- Directory of community officials by region
- Search and filter by name, role, or responsibility
- Contact information (email, phone)
- Responsibility breakdown for each official
- Region-based filtering

#### 3. Issue Predictor
- **AI-powered risk zone mapping** using historical data
- Interactive risk zone visualization with Leaflet
- Incident clustering algorithm
- Recent incident timeline
- Trend analysis (increasing/decreasing/stable)
- High-risk area alerts

#### 4. Cybersecurity Alerts
- **Anonymous incident reporting** toggle
- Multiple incident types (phishing, scam calls, fraud, malware, etc.)
- Real-time security alerts feed
- Community-wide threat notifications
- Privacy-focused data storage

#### 5. Social Media Integration
- **Instagram DM** webhook integration
- **WhatsApp Business API** webhook support
- **Twitter/X** mentions webhook
- Automatic report parsing from social messages
- Cross-platform status updates

#### 6. Notifications System
- Real-time notifications with Supabase subscriptions
- Report status update notifications
- Agency response notifications
- Security alert notifications
- Mark as read/unread functionality
- Delete notifications

#### 7. Profile & Settings
- User profile management
- Notification preferences
- Theme switcher (light/dark)
- Region configuration
- Report history

### 🔐 Authentication
- Email/password authentication
- Google OAuth integration
- User role management (citizen, agency, admin)
- Protected routes
- Row Level Security (RLS) policies

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18**
- **TypeScript**
- **TailwindCSS v4**
- **Framer Motion** (animations)
- **Leaflet** (maps)
- **Lucide React** (icons)

### Backend
- **Supabase**
  - PostgreSQL database
  - Authentication
  - Storage (images)
  - Real-time subscriptions
  - Row Level Security

### APIs & Integrations
- Instagram Graph API
- WhatsApp Business API
- Twitter/X Account Activity API

## Getting Started

### Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)
- (Optional) Social media API credentials for webhooks

### 1. Installation

```bash
cd urbanos
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Social Media Integration (Optional)
INSTAGRAM_VERIFY_TOKEN=your-instagram-verify-token
INSTAGRAM_ACCESS_TOKEN=your-instagram-access-token
WHATSAPP_VERIFY_TOKEN=your-whatsapp-verify-token
WHATSAPP_ACCESS_TOKEN=your-whatsapp-access-token
TWITTER_API_KEY=your-twitter-api-key
TWITTER_API_SECRET=your-twitter-api-secret
TWITTER_BEARER_TOKEN=your-twitter-bearer-token
```

### 3. Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the migration files in `supabase/migrations/` in order:
   - `20240101000000_initial_schema.sql`
   - `20240101000001_rls_policies.sql`
   - `20240101000002_seed_data.sql`

### 4. Storage Setup

1. In Supabase dashboard, go to Storage
2. The `report-images` bucket is automatically created by the migration
3. Ensure RLS policies are enabled

### 5. Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Project Structure

```
urbanos/
├── app/
│   ├── (landing)/page.tsx          # Landing page
│   ├── os/                          # OS interface
│   │   ├── layout.tsx              # OS layout with taskbar
│   │   └── page.tsx                # OS page with all apps
│   └── api/webhooks/               # Social media webhooks
│       ├── instagram/route.ts
│       ├── whatsapp/route.ts
│       └── twitter/route.ts
├── components/
│   ├── landing/                    # Landing page components
│   │   ├── Hero.tsx
│   │   ├── FeatureSection.tsx
│   │   ├── FeaturesShowcase.tsx
│   │   └── CallToAction.tsx
│   ├── os/                         # OS interface components
│   │   ├── Taskbar.tsx
│   │   ├── AppWindow.tsx
│   │   └── Desktop.tsx
│   ├── apps/                       # Application components
│   │   ├── ReportsApp.tsx
│   │   ├── CommunityApp.tsx
│   │   ├── PredictorApp.tsx
│   │   ├── SecurityApp.tsx
│   │   ├── ProfileApp.tsx
│   │   ├── NotificationsApp.tsx
│   │   ├── reports/               # Report sub-components
│   │   │   ├── CreateReport.tsx
│   │   │   ├── ReportsList.tsx
│   │   │   ├── LocationPicker.tsx
│   │   │   └── AgencyDashboard.tsx
│   │   └── predictor/
│   │       └── RiskMap.tsx
│   └── auth/                      # Authentication components
│       ├── AuthModal.tsx
│       └── AuthButton.tsx
├── lib/
│   ├── supabase.ts                # Supabase client (browser)
│   ├── supabase-server.ts         # Supabase client (server)
│   ├── auth-context.tsx           # Authentication context
│   ├── os-context.tsx             # OS state management
│   └── social-parsers.ts          # Social media parsers
├── types/
│   ├── database.types.ts          # Supabase types
│   └── index.ts                   # Common types
└── supabase/
    ├── migrations/                # Database migrations
    └── README.md                  # Database documentation
```

## Key Features Explained

### Parallax Scrolling
The landing page uses Framer Motion's `useScroll` and `useTransform` hooks to create smooth parallax effects on scroll:
- Hero section with animated background blobs
- Feature sections with staggered animations
- Smooth scroll indicators

### Windows 11 Interface
- Glass effect using `backdrop-filter: blur()`
- Taskbar with centered icons and active indicators
- Fullscreen sliding app windows with spring animations
- Real-time clock and notification badges

### Real-time Updates
Uses Supabase real-time subscriptions for:
- Report status changes
- New notifications
- Security alerts
- Agency responses

### Social Media Integration
Webhook endpoints automatically parse messages and create reports:
- Hashtag-based type detection
- Location extraction
- Automatic confirmation responses

### Privacy & Security
- Row Level Security (RLS) on all tables
- Anonymous reporting for cybersecurity incidents
- Encrypted passwords
- Protected API routes

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

The app is optimized for Vercel deployment with:
- Automatic API routes
- Edge functions support
- Image optimization

### Environment Variables for Production

Make sure to add all environment variables in Vercel dashboard under Settings > Environment Variables.

### Webhook Configuration

After deployment, configure webhooks in respective platforms:

**Instagram:**
- Webhook URL: `https://your-domain.com/api/webhooks/instagram`
- Verify Token: Your `INSTAGRAM_VERIFY_TOKEN`

**WhatsApp:**
- Webhook URL: `https://your-domain.com/api/webhooks/whatsapp`
- Verify Token: Your `WHATSAPP_VERIFY_TOKEN`

**Twitter:**
- Webhook URL: `https://your-domain.com/api/webhooks/twitter`

## Usage Tips

### For Citizens
1. Sign up with email or Google
2. Create reports with photos and location
3. Track report status in real-time
4. View community officials in your region
5. Check issue predictor before traveling
6. Report security incidents anonymously

### For Agencies
1. Sign up with agency role
2. View all reports in your region
3. Update report statuses
4. Communicate with citizens
5. Track response times

### For Administrators
1. Manage community officials
2. View system-wide analytics
3. Moderate reports
4. Configure agencies

## Contributing

This is a demonstration project. Feel free to fork and modify for your needs.

## License

MIT License - feel free to use this project for your own city!

## Support

For questions or issues, please refer to the documentation in each component or contact the development team.

---

Built with ❤️ for civic engagement and community empowerment.
