# UrbanOS - Complete Architecture Design Document

## Document Overview

**Version:** 1.0  
**Last Updated:** February 5, 2026  
**Status:** Current Implementation + Future Vision  
**Purpose:** Comprehensive architectural documentation for UrbanOS civic engagement platform

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Overview](#2-system-overview)
3. [Current Architecture](#3-current-architecture)
4. [Application Layer](#4-application-layer)
5. [Data Architecture](#5-data-architecture)
6. [Integration Architecture](#6-integration-architecture)
7. [Security Architecture](#7-security-architecture)
8. [Future Scalability Architecture](#8-future-scalability-architecture)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Technology Stack](#10-technology-stack)

---

## 1. Executive Summary

### 1.1 What is UrbanOS?

UrbanOS is a comprehensive civic engagement platform that bridges the gap between citizens and local government. 
It provides a Windows 11-style interface where citizens can report issues, track pollution, connect with officials, and receive real-time alerts.

**Key Capabilities:**
- Multi-channel civic issue reporting (Web, Instagram, WhatsApp, Twitter)
- Real-time pollution and air quality monitoring
- AI-powered risk prediction and analysis
- Community engagement and official directory
- Administrative control panel for city management
- Real-time notifications and alerts system

**Target Users:**
- **Citizens:** Report issues, track progress, stay informed
- **Government Agencies:** Manage reports, respond to citizens
- **Administrators:** Full control over city operations and alerts

### 1.2 Architecture Goals

**Current Goals:**
- Provide seamless user experience with Windows 11-style interface
- Enable multi-platform civic engagement
- Real-time data synchronization via Supabase
- Secure authentication and role-based access control

**Future Goals (Scalability):**
- Support 1M+ concurrent users
- Handle 100K+ requests per second
- Process 10M+ data points efficiently
- Achieve <200ms API latency (p95)
- Maintain 99.95% uptime

---

## 2. System Overview

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Web App    │  │  Mobile App  │  │ Social Media │          │
│  │  (Next.js)   │  │   (Future)   │  │  Webhooks    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                          │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Windows 11-Style OS Interface                         │     │
│  │  • Taskbar  • App Windows  • Desktop  • Notifications │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Reports  │ │Community │ │Pollution │ │ Predictor│          │
│  │   App    │ │   App    │ │   App    │ │   App    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Security │ │  Alerts  │ │  Admin   │ │UrbanMind │          │
│  │   App    │ │   App    │ │  Panel   │ │   AI     │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Next.js API Routes (Server-Side)                        │   │
│  │  • /api/reports  • /api/weather  • /api/air-quality     │   │
│  │  • /api/webhooks • /api/chat     • /api/predictor       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION LAYER                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ Supabase │ │  Google  │ │ Weather  │ │ WhatsApp │          │
│  │   SDK    │ │ Gemini AI│ │   APIs   │ │   API    │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                        │
│  │Instagram │ │ Twitter  │ │  Twilio  │                        │
│  │   API    │ │   API    │ │   SMS    │                        │
│  └──────────┘ └──────────┘ └──────────┘                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                               │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Supabase (PostgreSQL + PostGIS)                       │     │
│  │  • Users  • Reports  • Agencies  • Pollution Data      │     │
│  │  • Alerts • Community Officials  • Notifications       │     │
│  │  • Real-time Subscriptions  • Row Level Security       │     │
│  └────────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────────┐     │
│  │  Supabase Storage                                       │     │
│  │  • Report Images  • User Uploads  • Documents          │     │
│  └────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Core Components

**Frontend Components:**
- Landing Page (Marketing site with parallax effects)
- OS Interface (Windows 11-style desktop environment)
- 11 Application Windows (Reports, Community, Pollution, etc.)
- Authentication System (Email/Password + Google OAuth)
- Real-time Notification System

**Backend Components:**
- Next.js API Routes (Server-side logic)
- Supabase Backend (Database + Auth + Storage + Real-time)
- External API Integrations (Weather, Air Quality, Social Media)
- AI Services (Google Gemini for predictions and chat)

**Data Components:**
- PostgreSQL Database with PostGIS (Spatial data)
- Real-time Subscriptions (Live updates)
- File Storage (Images and documents)
- Row Level Security (Data access control)

---

## 3. Current Architecture

### 3.1 Frontend Architecture

#### 3.1.1 Technology Stack

```typescript
// Core Framework
Next.js 16.1.6 (App Router)
React 19.2.0
TypeScript 5.x

// Styling
TailwindCSS v4
Framer Motion 12.31.0 (Animations)

// UI Components
Lucide React (Icons)
Leaflet + React-Leaflet (Maps)
Recharts (Data visualization)
Three.js + React Three Fiber (3D graphics)

// State Management
React Context API
- AuthContext (User authentication state)
- OSContext (OS interface state)
- ToastContext (Notifications)

// Smooth Scrolling
Lenis 1.3.15
GSAP 3.13.0
```

#### 3.1.2 Application Structure

```
app/
├── page.tsx                    # Landing page
├── layout.tsx                  # Root layout
├── globals.css                 # Global styles
├── os/
│   ├── page.tsx               # OS interface (11 apps)
│   └── layout.tsx             # OS layout
└── api/                       # API routes
    ├── reports/               # Report management
    ├── weather/               # Weather data
    ├── air-quality/           # Pollution data
    ├── webhooks/              # Social media webhooks
    ├── chat/                  # AI chat
    └── predictor/             # Risk prediction

components/
├── landing/                   # Landing page components
│   ├── Hero.tsx
│   ├── FeaturesShowcase.tsx
│   └── CallToAction.tsx
├── os/                        # OS interface components
│   ├── Taskbar.tsx           # Bottom taskbar
│   ├── Desktop.tsx           # Desktop with icons
│   ├── AppWindow.tsx         # App window wrapper
│   └── MapBackground.tsx     # Animated map background
├── apps/                      # Application components
│   ├── ReportsApp.tsx        # Issue reporting
│   ├── CommunityApp.tsx      # Officials directory
│   ├── PollutionApp.tsx      # Air quality monitor
│   ├── PredictorApp.tsx      # AI predictions
│   ├── SecurityApp.tsx       # Cybersecurity alerts
│   ├── AlertsApp.tsx         # Public alerts
│   ├── AdminPanel.tsx        # Admin controls
│   ├── UrbanMindApp.tsx      # AI chatbot
│   ├── CityMonitorApp.tsx    # 3D city view
│   ├── ProfileApp.tsx        # User profile
│   └── NotificationsApp.tsx  # Notifications
└── auth/                      # Authentication
    ├── AuthModal.tsx
    └── AuthButton.tsx
```


#### 3.1.3 OS Interface Design

The Windows 11-style interface consists of:

**Desktop Layer:**
- Animated map background (Leaflet)
- App icons (can be added to desktop)
- Weather widget (top-right corner)
- Settings panel (accessible via gear icon)

**Taskbar:**
- Centered app icons (Windows 11 style)
- Active app indicators
- Real-time clock
- Notification bell with badge count
- User profile menu

**App Windows:**
- Fullscreen sliding windows
- Glass effect backdrop with blur
- Minimize/Maximize/Close controls
- Smooth animations (Framer Motion)
- Z-index management for overlapping windows

**State Management:**
```typescript
// OS Context manages:
- activeApps: string[]           // Currently open apps
- minimizedApps: string[]        // Minimized apps
- focusedApp: string | null      // Currently focused app
- openApp(appId: string)         // Open an app
- closeApp(appId: string)        // Close an app
- minimizeApp(appId: string)     // Minimize an app
- focusApp(appId: string)        // Bring app to front
```

### 3.2 Backend Architecture

#### 3.2.1 API Routes Structure

```typescript
// Next.js API Routes (Server-Side)

// Reports API
POST   /api/reports/public              // Create new report
GET    /api/reports/public              // Get all reports
POST   /api/reports/[id]/vote           // Vote on report

// Weather API
GET    /api/weather                     // Get weather data

// Air Quality API
GET    /api/air-quality                 // Current air quality
GET    /api/air-quality/historical      // Historical data

// Predictor API
POST   /api/predictor/analyze           // Analyze risk zones

// Chat API
POST   /api/chat/urban-mind             // AI chatbot

// Webhooks (Social Media Integration)
POST   /api/webhooks/instagram          // Instagram DM webhook
POST   /api/webhooks/whatsapp           // WhatsApp webhook
POST   /api/webhooks/twitter            // Twitter mention webhook

// Community Reports
POST   /api/community-reports/promote   // Promote to community report
POST   /api/community-reports/[id]/pil  // Generate PIL document
POST   /api/community-reports/[id]/send-email  // Send email
POST   /api/community-reports/[id]/followup    // Schedule followup

// Voice Reporting
POST   /api/voice-report/interpret      // Interpret voice input

// Email Tracking
GET    /api/tracking/email/[id]/[...params]  // Track email opens
```

#### 3.2.2 Service Layer

```typescript
lib/services/
├── ai-service.ts              // Google Gemini AI integration
├── pollution-api.ts           // Air quality data aggregation
├── openaq-service.ts          // OpenAQ API client
├── aqicn-service.ts           // AQICN API client
├── google-environment-api.ts  // Google Environment API
├── map-service.ts             // Map tile calculations
├── email-service.ts           // Email sending (Resend)
├── twilio-service.ts          // SMS/Voice (Twilio)
├── whatsapp-user-service.ts   // WhatsApp user management
├── pdf-generator.ts           // PDF document generation
├── authority-tagger.ts        // Auto-tag authorities
├── followup-scheduler.ts      // Schedule followups
└── esignature-validator.ts    // E-signature validation
```

#### 3.2.3 Data Access Layer

```typescript
// Supabase Client (Browser)
lib/supabase.ts
- createClient()               // Create browser client
- supabase                     // Singleton instance

// Supabase Client (Server)
lib/supabase-server.ts
- createServerClient()         // Create server client
- Used in API routes and server components

// Context Providers
lib/auth-context.tsx           // Authentication state
lib/os-context.tsx             // OS interface state
lib/toast-context.tsx          // Toast notifications
```

### 3.3 Database Architecture

#### 3.3.1 Core Tables

```sql
-- User Management
users                          -- User profiles and roles
  - id (uuid, PK)
  - email (text)
  - full_name (text)
  - role (enum: citizen, agency, admin)
  - region (text)
  - created_at, updated_at

-- Civic Reports
reports                        -- Citizen-submitted reports
  - id (uuid, PK)
  - user_id (uuid, FK)
  - type (enum: pothole, streetlight, garbage, etc.)
  - title, description (text)
  - location (jsonb: lat, lng, address)
  - status (enum: submitted, received, in-progress, resolved)
  - priority (enum: low, medium, high)
  - images (text[])
  - videos (text[])
  - is_anonymous (boolean)
  - source (enum: web, instagram, whatsapp, twitter)
  - agency_id (uuid, FK)
  - submitted_at, resolved_at (timestamp)

report_votes                   -- Community voting on reports
  - id (uuid, PK)
  - report_id (uuid, FK)
  - user_id (uuid, FK)
  - vote_type (enum: upvote, downvote)

report_comments                -- Comments on reports
  - id (uuid, PK)
  - report_id (uuid, FK)
  - user_id (uuid, FK)
  - comment (text)
  - is_agency (boolean)

report_history                 -- Audit trail
  - id (uuid, PK)
  - report_id (uuid, FK)
  - changed_by (uuid, FK)
  - old_status, new_status (text)
  - changed_at (timestamp)

-- Community Reports (Escalated)
community_reports              -- Reports promoted to community level
  - id (uuid, PK)
  - report_id (uuid, FK)
  - promoted_by (uuid, FK)
  - vote_count (integer)
  - status (enum: draft, active, resolved)
  - tagged_authorities (text[])

e_signatures                   -- Digital signatures
  - id (uuid, PK)
  - community_report_id (uuid, FK)
  - user_id (uuid, FK)
  - signature_data (text)
  - signed_at (timestamp)

pil_documents                  -- Public Interest Litigation docs
  - id (uuid, PK)
  - community_report_id (uuid, FK)
  - document_url (text)
  - generated_at (timestamp)

followups                      -- Scheduled followups
  - id (uuid, PK)
  - community_report_id (uuid, FK)
  - scheduled_for (timestamp)
  - status (enum: pending, sent, failed)

-- Government Agencies
agencies                       -- Government departments
  - id (uuid, PK)
  - name, type (text)
  - email, phone (text)
  - region (text)
  - avg_response_time_hours (float)
  - total_reports, resolved_reports (integer)

community_officials            -- Local officials directory
  - id (uuid, PK)
  - name, role, region (text)
  - responsibilities (text[])
  - email, phone (text)
  - photo_url (text)

-- Alerts & Notifications
alerts                         -- Public alerts
  - id (uuid, PK)
  - type (enum: road_closure, emergency, construction, etc.)
  - title, message (text)
  - location (jsonb)
  - severity (enum: low, medium, high, critical)
  - is_active (boolean)
  - created_by (uuid, FK)
  - expires_at (timestamp)

notifications                  -- User notifications
  - id (uuid, PK)
  - user_id (uuid, FK)
  - type (enum: report_update, agency_response, security_alert)
  - title, message (text)
  - report_id (uuid, FK, nullable)
  - read (boolean)

-- Admin Features
area_lockdowns                 -- Area restrictions
  - id (uuid, PK)
  - area_name (text)
  - location (jsonb)
  - reason (text)
  - is_active (boolean)
  - created_by (uuid, FK)

congestion_tracking            -- Traffic congestion
  - id (uuid, PK)
  - area_name (text)
  - location (jsonb)
  - congestion_level (enum: low, medium, high)
  - reported_at (timestamp)

-- Pollution Data
pollution_data                 -- Air quality measurements
  - id (uuid, PK)
  - location (geometry: Point)
  - timestamp (timestamptz)
  - aqi_value (float)
  - pm25_aqi, pm10_aqi (float)
  - source (text)

-- Historical Data
historical_incidents           -- Past incidents for AI prediction
  - id (uuid, PK)
  - type (text)
  - location (jsonb)
  - occurred_at (timestamp)
  - severity (enum: low, medium, high)
```


#### 3.3.2 Database Functions

```sql
-- Spatial queries (PostGIS)
get_pollution_in_bounds(min_lat, max_lat, min_lng, max_lng)
  -- Returns pollution data within bounding box

get_pollution_clusters_in_bounds(min_lat, max_lat, min_lng, max_lng, grid_size)
  -- Returns aggregated clusters for low zoom levels

-- User management
create_user_profile(user_id, email, full_name)
  -- Creates user profile after OAuth signup

-- Email tracking
increment_email_opens(community_report_id)
  -- Tracks email open events

-- Authority tagging
auto_tag_authorities(community_report_id)
  -- Automatically tags relevant authorities
```

#### 3.3.3 Row Level Security (RLS)

```sql
-- Users table
- Users can read their own profile
- Users can update their own profile
- Service role can create profiles

-- Reports table
- Anyone can read all reports (public data)
- Authenticated users can create reports
- Report owners can update their own reports
- Agencies can update assigned reports

-- Community Reports
- Anyone can read community reports
- Authenticated users can promote reports
- Report creators can manage their community reports

-- Notifications
- Users can only read their own notifications
- System can create notifications for any user

-- Admin tables (alerts, lockdowns, congestion)
- Anyone can read (public information)
- Only admins can create/update/delete
```

---

## 4. Application Layer

### 4.1 Reports Application

**Purpose:** Enable citizens to report civic issues with photos, location, and description.

**Features:**
- Create new reports with multiple images/videos
- Interactive map for location selection
- Voice input for description (Twilio)
- Real-time status tracking
- Vote on reports (upvote/downvote)
- Comment on reports
- View report history
- Agency dashboard for managing reports

**Data Flow:**
```
User Input → Validation → Supabase Insert → 
Real-time Broadcast → Agency Notification → 
Status Updates → User Notification
```

**Key Components:**
- `CreateReport.tsx` - Report creation form
- `ReportsList.tsx` - List of all reports
- `ReportDetailModal.tsx` - Detailed report view
- `LocationPicker.tsx` - Interactive map picker
- `VoiceInput.tsx` - Voice recording
- `ReportVoting.tsx` - Voting interface
- `AgencyDashboard.tsx` - Agency management

### 4.2 Community Application

**Purpose:** Connect citizens with local officials and community leaders.

**Features:**
- Directory of community officials
- Search and filter by region/role
- Contact information (email, phone)
- Responsibility breakdown
- Discussion rooms for community engagement

**Data Flow:**
```
Database Query → Filter by Region → 
Display Officials → Contact Actions
```

**Key Components:**
- `CommunityApp.tsx` - Main directory
- `DiscussionRooms.tsx` - Community discussions

### 4.3 Pollution Monitor Application

**Purpose:** Display real-time air quality data and health recommendations.

**Features:**
- Real-time AQI display
- Multiple data sources (OpenAQ, AQICN, Google Environment API)
- Interactive charts (hourly breakdown)
- Pollutant breakdown (PM2.5, PM10, O3, NO2, SO2, CO)
- Health recommendations based on AQI
- Historical data comparison
- Health visualizer with color-coded zones

**Data Flow:**
```
External APIs → Data Aggregation → 
Cache (5 min) → Display → 
Real-time Updates (every 10 min)
```

**Key Components:**
- `PollutionApp.tsx` - Main interface
- `PollutionCharts.tsx` - Data visualization
- `HourlyBreakdown.tsx` - Hourly AQI chart
- `PollutantBreakdown.tsx` - Individual pollutants
- `HealthRecommendations.tsx` - Health advice
- `HealthVisualizer.tsx` - Visual health zones
- `ComparisonWidget.tsx` - Compare with other cities

### 4.4 Issue Predictor Application

**Purpose:** Use AI to predict high-risk areas based on historical data.

**Features:**
- AI-powered risk zone mapping
- Interactive risk visualization
- Incident clustering
- Trend analysis
- High-risk area alerts
- Historical incident data

**Data Flow:**
```
Historical Data → Google Gemini AI → 
Risk Analysis → Cluster Calculation → 
Map Visualization → User Alerts
```

**Key Components:**
- `PredictorApp.tsx` - Main interface
- `RiskMap.tsx` - Interactive risk map
- `/api/predictor/analyze` - AI analysis endpoint

### 4.5 Security Application

**Purpose:** Report and track cybersecurity incidents anonymously.

**Features:**
- Anonymous reporting
- Multiple incident types (phishing, scam calls, fraud, malware)
- Real-time alerts
- Community-wide notifications
- Privacy-focused design

**Data Flow:**
```
Anonymous Report → Validation → 
Database Insert → Broadcast Alert → 
Community Notification
```

### 4.6 Alerts Application

**Purpose:** Display public alerts about city-wide issues.

**Features:**
- Road closures
- Construction updates
- Emergency alerts
- Disaster relief locations
- Real-time updates
- Severity-based filtering

**Data Flow:**
```
Admin Creates Alert → Database Insert → 
Real-time Broadcast → User Notification → 
Auto-expire after duration
```

### 4.7 Admin Panel

**Purpose:** Full administrative control for city administrators.

**Features:**
- Reports management (view all, update status)
- Alerts management (create, activate, deactivate)
- Area lockdowns (restrict areas)
- Congestion tracking (mark congested areas)
- Analytics dashboard
- Real-time monitoring

**Access Control:**
- Only users with role='admin' can access
- Protected API routes with role verification

**Key Components:**
- `AdminPanel.tsx` - Main dashboard
- `MapPicker.tsx` - Location selection for lockdowns

### 4.8 UrbanMind AI Application

**Purpose:** AI-powered chatbot for civic assistance.

**Features:**
- Natural language conversation
- Google Gemini AI integration
- Context-aware responses
- Help with reporting issues
- Answer civic questions
- Provide recommendations

**Data Flow:**
```
User Message → Google Gemini API → 
AI Response → Display → 
Conversation History
```

### 4.9 CityMonitor 3D Application

**Purpose:** 3D visualization of city data.

**Features:**
- 3D city model (Three.js)
- Real-time data overlay
- Interactive camera controls
- Visual representation of reports/pollution

**Technology:**
- React Three Fiber
- Three.js
- GLB model loading

### 4.10 Profile & Settings Application

**Purpose:** User account management.

**Features:**
- Update profile information
- Change notification preferences
- Theme switcher (light/dark)
- Region configuration
- View report history
- Account settings

### 4.11 Notifications Application

**Purpose:** Centralized notification management.

**Features:**
- Real-time notifications
- Mark as read/unread
- Filter by type
- Delete notifications
- Notification badges

**Data Flow:**
```
Event Trigger → Create Notification → 
Real-time Broadcast → Update Badge Count → 
User Views → Mark as Read
```

---

## 5. Data Architecture

### 5.1 Data Flow Patterns

#### 5.1.1 Create Report Flow

```
┌─────────────┐
│   User      │
│  (Citizen)  │
└──────┬──────┘
       │ 1. Fill form + upload images
       ▼
┌─────────────────────────┐
│  CreateReport Component │
│  - Validate input       │
│  - Upload images to     │
│    Supabase Storage     │
└──────┬──────────────────┘
       │ 2. Submit report
       ▼
┌─────────────────────────┐
│  Supabase Insert        │
│  - reports table        │
│  - Trigger RLS check    │
└──────┬──────────────────┘
       │ 3. Real-time broadcast
       ▼
┌─────────────────────────┐
│  Real-time Subscription │
│  - All connected clients│
│  - Update UI            │
└──────┬──────────────────┘
       │ 4. Create notification
       ▼
┌─────────────────────────┐
│  Notification System    │
│  - Notify agencies      │
│  - Notify admins        │
└─────────────────────────┘
```


#### 5.1.2 Real-time Updates Flow

```
┌─────────────────────────┐
│  Database Change        │
│  (INSERT/UPDATE/DELETE) │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Supabase Real-time     │
│  - Detect change        │
│  - Broadcast to clients │
└──────┬──────────────────┘
       │
       ▼
┌─────────────────────────┐
│  Client Subscription    │
│  - Receive update       │
│  - Update local state   │
│  - Re-render UI         │
└─────────────────────────┘
```

#### 5.1.3 Social Media Integration Flow

```
┌─────────────────────────┐
│  Social Media Platform  │
│  (Instagram/WhatsApp/   │
│   Twitter)              │
└──────┬──────────────────┘
       │ 1. User sends message
       ▼
┌─────────────────────────┐
│  Webhook Endpoint       │
│  /api/webhooks/*        │
│  - Verify signature     │
│  - Parse message        │
└──────┬──────────────────┘
       │ 2. Extract data
       ▼
┌─────────────────────────┐
│  Social Parser          │
│  - Extract issue type   │
│  - Extract location     │
│  - Extract description  │
└──────┬──────────────────┘
       │ 3. Create report
       ▼
┌─────────────────────────┐
│  Create Report          │
│  - Insert to database   │
│  - Link to social user  │
└──────┬──────────────────┘
       │ 4. Send confirmation
       ▼
┌─────────────────────────┐
│  Reply to User          │
│  - Confirmation message │
│  - Report ID            │
└─────────────────────────┘
```

### 5.2 Caching Strategy (Current)

**Browser-Level Caching:**
- Static assets cached by Next.js
- API responses cached with SWR/React Query patterns
- Service Worker for offline support (future)

**Supabase Caching:**
- Built-in query caching
- Connection pooling (PgBouncer)

**API Response Caching:**
- Weather data: 10 minutes
- Air quality data: 5 minutes
- Static data (officials, agencies): 1 hour

### 5.3 Data Validation

**Client-Side Validation:**
- Form validation (required fields, formats)
- Image size/type validation
- Location validation (valid coordinates)

**Server-Side Validation:**
- API route validation
- Database constraints
- Row Level Security policies

**Data Sanitization:**
- XSS prevention (sanitize HTML)
- SQL injection prevention (parameterized queries)
- File upload validation (type, size, malware scan)

---

## 6. Integration Architecture

### 6.1 External API Integrations

#### 6.1.1 Google Gemini AI

**Purpose:** AI-powered predictions and chatbot

**Integration:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

// Use cases:
- Risk prediction analysis
- Chatbot conversations
- Report summarization
- Trend analysis
```

**Endpoints:**
- `/api/predictor/analyze` - Risk analysis
- `/api/chat/urban-mind` - Chatbot

#### 6.1.2 Weather APIs

**Purpose:** Real-time weather data

**Integration:**
```typescript
// MetaSource API
const weatherData = await fetch(
  `https://api.metasource.com/weather?location=${location}`
);

// Use cases:
- Display current weather
- Weather-based recommendations
- Correlate weather with reports
```

**Endpoints:**
- `/api/weather` - Current weather

#### 6.1.3 Air Quality APIs

**Purpose:** Real-time pollution monitoring

**Integration:**
```typescript
// Multiple sources for redundancy
1. OpenAQ API - Global air quality data
2. AQICN API - World Air Quality Index
3. Google Environment API - Air quality data

// Data aggregation:
- Fetch from all sources
- Average values
- Use most recent data
- Fallback if one fails
```

**Endpoints:**
- `/api/air-quality` - Current AQI
- `/api/air-quality/historical` - Historical data

#### 6.1.4 WhatsApp Business API

**Purpose:** Receive reports via WhatsApp

**Integration:**
```typescript
// Twilio WhatsApp API
import twilio from 'twilio';

const client = twilio(accountSid, authToken);

// Webhook flow:
1. User sends WhatsApp message
2. Twilio forwards to /api/webhooks/whatsapp
3. Parse message content
4. Create report in database
5. Send confirmation to user
```

**Endpoints:**
- `/api/webhooks/whatsapp` - Receive messages

#### 6.1.5 Instagram Graph API

**Purpose:** Receive reports via Instagram DMs

**Integration:**
```typescript
// Instagram Messaging API
// Webhook flow:
1. User sends Instagram DM with hashtag
2. Instagram forwards to /api/webhooks/instagram
3. Parse message and extract data
4. Create report
5. Reply with confirmation
```

**Endpoints:**
- `/api/webhooks/instagram` - Receive DMs

#### 6.1.6 Twitter API

**Purpose:** Receive reports via Twitter mentions

**Integration:**
```typescript
// Twitter API v2
// Webhook flow:
1. User mentions @UrbanOS with issue
2. Twitter forwards to /api/webhooks/twitter
3. Parse tweet content
4. Create report
5. Reply with confirmation
```

**Endpoints:**
- `/api/webhooks/twitter` - Receive mentions

#### 6.1.7 Twilio (SMS/Voice)

**Purpose:** Voice reporting and SMS notifications

**Integration:**
```typescript
import twilio from 'twilio';

// Voice reporting:
1. User calls Twilio number
2. Record voice message
3. Transcribe using Twilio
4. Send to /api/voice-report/interpret
5. Create report from transcription

// SMS notifications:
- Send SMS alerts to users
- Send verification codes
```

**Endpoints:**
- `/api/voice-report/interpret` - Process voice input

#### 6.1.8 Email Service (Resend)

**Purpose:** Send email notifications and documents

**Integration:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Use cases:
- Send report updates
- Send PIL documents
- Send community report notifications
- Email tracking (open rates)
```

**Endpoints:**
- `/api/community-reports/[id]/send-email` - Send email

### 6.2 Authentication Integration

#### 6.2.1 Supabase Auth

**Providers:**
- Email/Password (native)
- Google OAuth 2.0
- Future: GitHub, Facebook, Apple

**Flow:**
```typescript
// Google OAuth Flow:
1. User clicks "Sign in with Google"
2. Redirect to Google OAuth consent
3. Google redirects to /auth/callback
4. Exchange code for session
5. Create user profile in database
6. Redirect to /os (main app)

// Email/Password Flow:
1. User enters email/password
2. Supabase validates credentials
3. Create session
4. Create user profile
5. Redirect to /os
```

**Session Management:**
- JWT tokens stored in cookies
- Automatic token refresh
- Server-side session validation
- Row Level Security based on user ID

---

## 7. Security Architecture

### 7.1 Authentication & Authorization

**Authentication Methods:**
- Email/Password (Supabase Auth)
- Google OAuth 2.0
- Session-based (JWT tokens)

**Authorization Levels:**
```typescript
enum UserRole {
  CITIZEN = 'citizen',    // Default role
  AGENCY = 'agency',      // Government agency
  ADMIN = 'admin'         // System administrator
}

// Role-based access:
- Citizens: Create reports, vote, comment
- Agencies: Manage assigned reports, respond
- Admins: Full access, create alerts, lockdowns
```

**Protected Routes:**
```typescript
// Middleware checks:
- /os/* - Requires authentication
- /api/reports/* - Requires authentication for POST
- /api/admin/* - Requires admin role
- /api/webhooks/* - Requires valid signature
```

### 7.2 Data Security

**Row Level Security (RLS):**
```sql
-- Example: Reports table
CREATE POLICY "Users can read all reports"
  ON reports FOR SELECT
  USING (true);

CREATE POLICY "Users can create reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Agencies can update assigned reports"
  ON reports FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM agencies WHERE id = reports.agency_id
    )
  );
```

**Data Encryption:**
- TLS 1.3 for data in transit
- Database encryption at rest (Supabase)
- Encrypted file storage (Supabase Storage)
- Password hashing (bcrypt via Supabase)

**API Security:**
- CORS configuration (allowed origins)
- Rate limiting (future: Redis-based)
- Request validation (Zod schemas)
- SQL injection prevention (parameterized queries)
- XSS prevention (sanitize inputs)

### 7.3 Privacy & Compliance

**Anonymous Reporting:**
- Option to report without revealing identity
- No personal data stored for anonymous reports
- IP addresses not logged

**Data Privacy:**
- GDPR compliance (right to erasure, data portability)
- User data deletion on account closure
- Minimal data collection
- Clear privacy policy

**Audit Trail:**
- Report history tracking
- Admin action logging
- Email open tracking
- Change timestamps

---

## 8. Future Scalability Architecture

### 8.1 Grid-Based Data Partitioning (Future)

**Purpose:** Handle millions of data points efficiently by dividing map into tiles.

**Implementation:**
```typescript
// Tile coordinate system (Web Mercator)
interface TileCoordinate {
  x: number;  // Tile X
  y: number;  // Tile Y
  z: number;  // Zoom level
}

// Grid ID format: "z{zoom}-x{x}-y{y}"
// Example: "z12-2048-1536"

// Functions:
- latLngToTile(lat, lng, zoom) → TileCoordinate
- tileToBounds(x, y, z) → GridBounds
- getTilesInBounds(bounds, zoom) → TileCoordinate[]
```

**Benefits:**
- Load only visible map area
- Reduce data transfer by 90%+
- Enable efficient caching per grid
- Support millions of data points


### 8.2 Queue-Based Update System (Future)

**Purpose:** Batch process updates every 10 seconds to reduce database load.

**Architecture:**
```
Data Sources → Validation → Redis Streams → 
Workers (batch every 10s) → Aggregation → 
Database → Cache Invalidation → WebSocket Broadcast
```

**Implementation:**
```typescript
// Redis Streams configuration
const QUEUE_CONFIG = {
  streamName: 'urbanos:updates',
  consumerGroup: 'update-processors',
  batchSize: 1000,
  processingInterval: 10000, // 10 seconds
};

// Queue processor:
1. Collect updates for 10 seconds
2. Group by grid ID
3. Deduplicate
4. Aggregate (average, max, count)
5. Batch insert to database
6. Invalidate cache
7. Broadcast to WebSocket subscribers
```

**Benefits:**
- Reduce database writes by 90%+
- Handle 100K+ updates/second
- Smooth out traffic spikes
- Enable horizontal scaling

### 8.3 Multi-Layer Caching (Future)

**Caching Layers:**
```
Browser Cache (30s) →
CDN Cache (10s) →
Redis Cache (5s) →
Database Query Cache
```

**Implementation:**
```typescript
// Redis cache
const CACHE_TTL = {
  gridData: 5,        // 5 seconds
  aggregated: 10,     // 10 seconds
  historical: 300,    // 5 minutes
};

// Cache key format: "grid:{gridId}:{dataType}"
// Example: "grid:z12-2048-1536:pollution"

// Cache flow:
1. Check browser cache (30s TTL)
2. If miss, check CDN cache (10s TTL)
3. If miss, check Redis cache (5s TTL)
4. If miss, query database
5. Store in all caches
6. Return to client
```

**Benefits:**
- Reduce database load by 95%+
- <50ms response time (cache hit)
- Support 1M+ concurrent users
- Reduce infrastructure costs

### 8.4 WebSocket Optimization (Future)

**Purpose:** Real-time updates only for visible grids.

**Architecture:**
```typescript
// Grid-based subscriptions
class GridSubscriptionManager {
  subscribeToGrid(gridId: string)
  unsubscribeFromGrid(gridId: string)
  updateSubscriptions(visibleGrids: string[])
}

// Flow:
1. User pans map
2. Calculate visible grids
3. Subscribe to visible grids
4. Unsubscribe from hidden grids
5. Receive updates only for subscribed grids
```

**Benefits:**
- Reduce WebSocket traffic by 90%+
- Scale to millions of connections
- Efficient resource usage
- Real-time updates where needed

### 8.5 Database Optimization (Future)

**Table Partitioning:**
```sql
-- Partition by date (daily)
CREATE TABLE pollution_data (
  ...
  created_date DATE NOT NULL DEFAULT CURRENT_DATE
) PARTITION BY RANGE (created_date);

-- Auto-create partitions
CREATE TABLE pollution_data_2026_02_05 
  PARTITION OF pollution_data
  FOR VALUES FROM ('2026-02-05') TO ('2026-02-06');

-- Auto-delete old partitions (90 days)
DROP TABLE pollution_data_2025_11_07;
```

**Spatial Indexing:**
```sql
-- PostGIS spatial index
CREATE INDEX idx_pollution_location 
  ON pollution_data 
  USING GIST (location);

-- Composite index
CREATE INDEX idx_pollution_grid_time 
  ON pollution_data (grid_id, timestamp DESC);
```

**Read Replicas:**
```
Primary (writes) → Replica 1 (reads)
                 → Replica 2 (reads)
                 → Replica 3 (reads)

// Load balancing: Round-robin across replicas
```

**Benefits:**
- Query time <50ms (p95)
- Support 10M+ data points
- Efficient spatial queries
- Horizontal read scaling

### 8.6 Horizontal Scaling (Future)

**Auto-Scaling Configuration:**
```yaml
# Kubernetes HPA
minReplicas: 10
maxReplicas: 100

metrics:
  - CPU: 70%
  - Memory: 80%
  - Request rate: 1000 req/s per pod

scaleUp: 50% every 60s
scaleDown: 10% every 300s
```

**Load Balancing:**
```
CloudFlare CDN →
Application Load Balancer →
API Server 1, 2, 3, ..., N

Algorithm: Least connections
Health checks: Every 10s
```

**Benefits:**
- Handle 100K+ requests/second
- Auto-scale based on demand
- 99.95% uptime
- Cost-efficient (scale down when idle)

---

## 9. Deployment Architecture

### 9.1 Current Deployment (Vercel)

**Platform:** Vercel (Serverless)

**Configuration:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "devCommand": "npm run dev"
}
```

**Environment Variables:**
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# App
NEXT_PUBLIC_APP_URL

# APIs
GEMINI_API_KEY
METASOURCE_API_KEY
DATA_GOV_IN_API_KEY
RESEND_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
```

**Deployment Flow:**
```
Git Push → GitHub →
Vercel Webhook →
Build (Next.js) →
Deploy to Edge Network →
Live in 2-3 minutes
```

**Features:**
- Automatic deployments on push
- Preview deployments for PRs
- Edge network (global CDN)
- Serverless functions
- Zero-config SSL

### 9.2 Database Deployment (Supabase)

**Platform:** Supabase Cloud

**Configuration:**
- PostgreSQL 15+ with PostGIS
- Connection pooling (PgBouncer)
- Automatic backups (daily)
- Point-in-time recovery
- Read replicas (future)

**Migrations:**
```bash
# Run migrations in order
supabase/migrations/
  20240101000000_initial_schema.sql
  20240101000001_rls_policies.sql
  20240101000002_seed_data.sql
  ...
  20240204000001_get_pollution_clusters.sql
```

### 9.3 Future Deployment (Kubernetes)

**Platform:** Kubernetes (AWS EKS / GCP GKE)

**Architecture:**
```
┌─────────────────────────────────────────┐
│         CloudFlare CDN (Global)         │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Application Load Balancer          │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Kubernetes Cluster              │
│  ┌──────────┐  ┌──────────┐            │
│  │ API Pods │  │ WS Pods  │            │
│  │ (10-100) │  │ (5-50)   │            │
│  └──────────┘  └──────────┘            │
│  ┌──────────┐  ┌──────────┐            │
│  │  Queue   │  │  Redis   │            │
│  │ Workers  │  │ Cluster  │            │
│  └──────────┘  └──────────┘            │
└─────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      PostgreSQL (Primary + Replicas)    │
└─────────────────────────────────────────┘
```

**Benefits:**
- Full control over infrastructure
- Custom scaling policies
- Multi-region deployment
- Advanced monitoring
- Cost optimization

---

## 10. Technology Stack

### 10.1 Frontend Technologies

```typescript
// Core Framework
Next.js 16.1.6              // React framework
React 19.2.0                // UI library
TypeScript 5.x              // Type safety

// Styling
TailwindCSS v4             // Utility-first CSS
Framer Motion 12.31.0      // Animations

// UI Components
Lucide React 0.554.0       // Icons
Leaflet 1.9.4              // Maps
React-Leaflet 5.0.0        // React wrapper for Leaflet
Recharts 3.5.0             // Charts
Three.js 0.181.2           // 3D graphics
React Three Fiber 9.4.0    // React wrapper for Three.js

// Utilities
Lenis 1.3.15               // Smooth scrolling
GSAP 3.13.0                // Animations
clsx 2.1.1                 // Class names
tailwind-merge 3.4.0       // Merge Tailwind classes
```

### 10.2 Backend Technologies

```typescript
// Runtime
Node.js 20+                // JavaScript runtime

// Backend-as-a-Service
Supabase 2.84.0            // Database + Auth + Storage
@supabase/ssr 0.7.0        // Server-side rendering

// AI & ML
@google/generative-ai 0.24.1  // Google Gemini AI

// Communication
Twilio 5.3.5               // SMS/Voice/WhatsApp

// Utilities
class-variance-authority 0.7.1  // Component variants
```

### 10.3 Database Technologies

```sql
-- Database
PostgreSQL 15+             -- Relational database
PostGIS                    -- Spatial extension

-- Features
- Row Level Security (RLS)
- Real-time subscriptions
- Connection pooling (PgBouncer)
- Spatial indexing (GIST)
- Full-text search
```

### 10.4 Development Tools

```bash
# Package Manager
npm / pnpm

# Linting
ESLint 9                   # Code linting
eslint-config-next 16.1.6  # Next.js ESLint config

# Type Checking
TypeScript 5.x             # Static type checking

# Build Tools
@tailwindcss/postcss 4     # CSS processing
PostCSS                    # CSS transformations
```

### 10.5 External Services

```
Authentication:
- Supabase Auth (Email/Password, OAuth)
- Google OAuth 2.0

AI & ML:
- Google Gemini AI (Predictions, Chat)

Weather & Environment:
- MetaSource API (Weather)
- OpenAQ API (Air quality)
- AQICN API (Air quality)
- Google Environment API (Air quality)

Communication:
- Twilio (SMS, Voice, WhatsApp)
- Resend (Email)
- Instagram Graph API (DMs)
- Twitter API (Mentions)

Infrastructure:
- Vercel (Hosting, CDN)
- Supabase (Database, Storage)
- CloudFlare (CDN, DDoS protection) [Future]
```

---

## Appendix

### A. Glossary

**AQI:** Air Quality Index - Measure of air pollution  
**CDN:** Content Delivery Network - Distributed server network  
**GIST:** Generalized Search Tree - PostgreSQL index type  
**HPA:** Horizontal Pod Autoscaler - Kubernetes scaling  
**JWT:** JSON Web Token - Authentication token  
**OAuth:** Open Authorization - Authentication protocol  
**PIL:** Public Interest Litigation - Legal document  
**PostGIS:** PostgreSQL extension for spatial data  
**RLS:** Row Level Security - Database access control  
**SLA:** Service Level Agreement - Uptime guarantee  
**TTL:** Time To Live - Cache expiration time  
**WebSocket:** Full-duplex communication protocol  

### B. Performance Targets

**Current Performance:**
- Page load time: ~2-3 seconds
- API response time: ~200-500ms
- Real-time latency: ~100-200ms
- Concurrent users: ~1,000

**Future Performance (with scalability features):**
- Page load time: <2 seconds (p95)
- API response time: <200ms (p95)
- Real-time latency: <100ms
- Concurrent users: 1M+
- Requests/second: 100K+
- Uptime: 99.95%

### C. Future Roadmap

**Phase 1 (Current):**
- ✅ Core civic engagement features
- ✅ Multi-platform reporting
- ✅ Real-time updates
- ✅ AI-powered predictions
- ✅ Admin panel

**Phase 2 (Next 6 months):**
- Grid-based data partitioning
- Redis caching layer
- Queue-based updates
- WebSocket optimization
- Mobile app (iOS/Android)

**Phase 3 (6-12 months):**
- Kubernetes deployment
- Multi-region support
- Advanced analytics
- Voice reporting
- SMS notifications

**Phase 4 (12-24 months):**
- Multi-city support (100+ cities)
- Blockchain integration
- IoT sensor integration
- AR visualization
- Advanced ML models

---

**Document End**

*For questions or clarifications, contact the UrbanOS development team.*
