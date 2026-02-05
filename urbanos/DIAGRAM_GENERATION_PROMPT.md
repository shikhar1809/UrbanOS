# UrbanOS - Architectural Diagram Generation Prompt

## Instructions for AI Diagram Tools (e.g., Nano Banana, Mermaid AI, etc.)

Use this prompt to generate comprehensive architectural diagrams for the UrbanOS civic engagement platform.

---

## Main Prompt for Diagram Generation

```
Create comprehensive architectural diagrams for UrbanOS, a civic engagement platform with the following characteristics:

## System Overview
UrbanOS is a Windows 11-style web application that connects citizens with local government. It enables multi-channel civic issue reporting, real-time pollution monitoring, AI-powered predictions, and administrative city management.

## Architecture Layers

### 1. CLIENT LAYER
- Web Application (Next.js 16, React 19, TypeScript)
- Mobile Browsers (responsive design)
- Future: Native iOS/Android apps
- Social Media Platforms (Instagram, WhatsApp, Twitter)

### 2. PRESENTATION LAYER
- Windows 11-Style OS Interface
  - Taskbar (centered icons, clock, notifications)
  - Desktop (animated map background, app icons)
  - App Windows (11 applications with glass effect)
  - Settings Panel
  - Weather Widget

### 3. APPLICATION LAYER (11 Apps)
1. Reports App - Civic issue reporting with photos/videos
2. Community App - Officials directory and discussions
3. Pollution Monitor - Real-time air quality data
4. Issue Predictor - AI-powered risk analysis
5. Security App - Cybersecurity incident reporting
6. Alerts App - Public alerts and notifications
7. Admin Panel - City management dashboard
8. UrbanMind AI - AI chatbot assistant
9. CityMonitor 3D - 3D city visualization
10. Profile App - User account management
11. Notifications App - Notification center

### 4. API LAYER (Next.js API Routes)
- /api/reports/* - Report management
- /api/weather - Weather data
- /api/air-quality/* - Pollution data
- /api/predictor/* - AI predictions
- /api/chat/* - AI chatbot
- /api/webhooks/* - Social media webhooks
- /api/community-reports/* - Community escalation
- /api/voice-report/* - Voice input processing
- /api/tracking/* - Email tracking

### 5. INTEGRATION LAYER
External Services:
- Supabase (Database + Auth + Storage + Real-time)
- Google Gemini AI (Predictions + Chatbot)
- Weather APIs (MetaSource)
- Air Quality APIs (OpenAQ, AQICN, Google Environment)
- Twilio (SMS, Voice, WhatsApp)
- Resend (Email)
- Instagram Graph API
- Twitter API v2

### 6. DATA LAYER
- PostgreSQL 15+ with PostGIS (Spatial data)
- Supabase Storage (Images, videos, documents)
- Real-time Subscriptions (Live updates)
- Row Level Security (Access control)

Key Tables:
- users (profiles and roles)
- reports (civic issues)
- report_votes, report_comments, report_history
- community_reports, e_signatures, pil_documents
- agencies, community_officials
- alerts, notifications
- area_lockdowns, congestion_tracking
- pollution_data, historical_incidents

### 7. FUTURE SCALABILITY LAYER
- Redis Cluster (Multi-layer caching)
- Redis Streams/AWS SQS (Message queue)
- WebSocket Server Cluster (Real-time updates)
- Load Balancer (Traffic distribution)
- CDN (CloudFlare - Global edge network)
- Kubernetes (Container orchestration)
- Auto-scaling (10-100 instances)

## Data Flow Examples

### Report Creation Flow:
User → CreateReport Component → Validate Input → Upload Images to Supabase Storage → 
Insert to Database → Real-time Broadcast → Agency Notification → Status Updates → User Notification

### Social Media Integration Flow:
Social Platform → Webhook Endpoint → Verify Signature → Parse Message → 
Extract Data (type, location, description) → Create Report → Send Confirmation

### Real-time Updates Flow:
Database Change → Supabase Real-time → Broadcast to Clients → 
Update Local State → Re-render UI

### Pollution Monitoring Flow:
External APIs → Data Aggregation → Cache (5 min) → Display Charts → 
Real-time Updates (every 10 min)

### AI Prediction Flow:
Historical Data → Google Gemini AI → Risk Analysis → Cluster Calculation → 
Map Visualization → User Alerts

## Technology Stack

Frontend:
- Next.js 16.1.6, React 19.2.0, TypeScript 5.x
- TailwindCSS v4, Framer Motion 12.31.0
- Leaflet 1.9.4 (Maps), Recharts 3.5.0 (Charts)
- Three.js 0.181.2 (3D Graphics)

Backend:
- Node.js 20+
- Supabase 2.84.0
- Google Gemini AI 0.24.1
- Twilio 5.3.5

Database:
- PostgreSQL 15+ with PostGIS
- Row Level Security (RLS)
- Real-time subscriptions
- Connection pooling (PgBouncer)

## Deployment Architecture

Current:
- Vercel (Serverless + Edge Network)
- Supabase Cloud (Database + Storage)
- Automatic deployments from GitHub

Future:
- Kubernetes (AWS EKS / GCP GKE)
- Multi-region deployment
- CloudFlare CDN
- Auto-scaling (10-100 pods)
- Load balancing

## Security Features
- JWT-based authentication
- Google OAuth 2.0
- Row Level Security (RLS)
- TLS 1.3 encryption
- Rate limiting
- CORS policies
- Webhook signature verification
- Input validation and sanitization

## Performance Targets

Current:
- 1,000 concurrent users
- 100 requests/second
- ~2-3 second page load
- ~200-500ms API response

Future (with scalability):
- 1M+ concurrent users
- 100K+ requests/second
- <2 second page load (p95)
- <200ms API response (p95)
- 99.95% uptime

## Diagram Requirements

Please create the following diagrams:

1. **High-Level System Architecture** - Show all layers from client to database
2. **Application Layer Detail** - Show all 11 applications and their relationships
3. **Data Flow Diagrams** - Show key flows (report creation, social media, real-time updates)
4. **Integration Architecture** - Show all external API integrations
5. **Database Schema** - Show key tables and relationships
6. **Deployment Architecture** - Show current (Vercel) and future (Kubernetes) deployments
7. **Security Architecture** - Show authentication, authorization, and data security
8. **Future Scalability Architecture** - Show grid partitioning, caching, queuing

Use clear visual hierarchy, color coding for different layers, and arrows to show data flow direction.
```

---

## Specific Diagram Requests

### Diagram 1: Complete System Architecture
```
Create a comprehensive system architecture diagram showing:
- All 7 layers (Client, Presentation, Application, API, Integration, Data, Future Scalability)
- Data flow between layers
- External integrations
- Color code: Blue for frontend, Green for backend, Orange for external services, Purple for data layer
```

### Diagram 2: Application Ecosystem
```
Create a diagram showing the 11 applications in the OS interface:
- Show Windows 11-style taskbar at bottom
- Show 11 app windows with their icons and names
- Show connections between apps (e.g., Reports → Community Reports)
- Show which apps connect to which APIs
- Use app-specific colors for each application
```

### Diagram 3: Data Flow - Report Creation
```
Create a detailed sequence diagram for report creation:
1. User fills form in Reports App
2. Upload images to Supabase Storage
3. Insert report to database
4. Real-time broadcast to all clients
5. Create notification for agencies
6. Agency receives notification
7. Agency updates status
8. User receives status update notification
Show timing and data passed at each step
```

### Diagram 4: Social Media Integration
```
Create a diagram showing social media integration:
- Instagram DM → Webhook → Parser → Report Creation
- WhatsApp Message → Webhook → Parser → Report Creation
- Twitter Mention → Webhook → Parser → Report Creation
- Voice Call → Twilio → Transcription → Report Creation
Show webhook verification, data extraction, and confirmation flow
```

### Diagram 5: Database Schema
```
Create an entity-relationship diagram showing:
- Core tables: users, reports, agencies, community_officials
- Relationship tables: report_votes, report_comments, report_history
- Community tables: community_reports, e_signatures, pil_documents, followups
- Admin tables: alerts, area_lockdowns, congestion_tracking
- Data tables: pollution_data, historical_incidents, notifications
Show primary keys, foreign keys, and relationships (1:1, 1:N, N:M)
```

### Diagram 6: Real-time Architecture
```
Create a diagram showing real-time data flow:
- Database change (INSERT/UPDATE/DELETE)
- Supabase Real-time detection
- Broadcast to subscribed clients
- Client receives update
- Update local state
- Re-render UI
Show WebSocket connections and subscription management
```

### Diagram 7: Future Scalability Architecture
```
Create a diagram showing the high-scale architecture:
- CloudFlare CDN (global edge)
- Load Balancer
- API Server Cluster (10-100 instances)
- WebSocket Server Cluster (5-50 instances)
- Redis Cluster (caching)
- Redis Streams (message queue)
- Queue Workers (batch processing)
- PostgreSQL Primary + Read Replicas
- S3 Storage
Show auto-scaling, caching layers, and data flow
```

### Diagram 8: Grid-Based Partitioning
```
Create a diagram showing grid-based data partitioning:
- Map divided into tiles (Web Mercator projection)
- Zoom levels 10-18
- Grid ID format: z{zoom}-x{x}-y{y}
- Visible grids loaded
- Adjacent grids preloaded
- Distant grids unloaded
- Cache per grid
Show viewport, loaded grids, and memory management
```

### Diagram 9: Multi-Layer Caching
```
Create a diagram showing caching strategy:
- Layer 1: Browser Cache (30s TTL)
- Layer 2: CDN Cache (10s TTL)
- Layer 3: Redis Cache (5s TTL)
- Layer 4: Database Query Cache
Show cache hit/miss flow and cache invalidation
```

### Diagram 10: Deployment Pipeline
```
Create a CI/CD pipeline diagram:
- Git Push → GitHub
- GitHub Actions triggered
- Run tests (lint, type-check, unit tests)
- Build Next.js application
- Deploy to Vercel (preview/production)
- Run smoke tests
- Notify team
Show parallel steps and failure handling
```

---

## Color Coding Guide

Use these colors for consistency across all diagrams:

- **Client Layer:** Light Blue (#3B82F6)
- **Presentation Layer:** Cyan (#06B6D4)
- **Application Layer:** Green (#10B981)
- **API Layer:** Yellow (#F59E0B)
- **Integration Layer:** Orange (#F97316)
- **Data Layer:** Purple (#8B5CF6)
- **Future/Scalability:** Red (#EF4444)
- **External Services:** Gray (#6B7280)
- **Security Elements:** Dark Red (#DC2626)
- **Real-time/WebSocket:** Pink (#EC4899)

---

## Output Format Preferences

- **Format:** SVG or PNG (high resolution)
- **Style:** Modern, clean, professional
- **Labels:** Clear, readable font (12-14pt)
- **Arrows:** Directional, labeled with data/action
- **Grouping:** Use boxes/containers for related components
- **Legend:** Include legend for colors and symbols

---

## Additional Context

**Project Name:** UrbanOS  
**Project Type:** Civic Engagement Platform  
**Architecture Style:** Layered + Microservices (future)  
**Deployment:** Serverless (current) → Kubernetes (future)  
**Scale:** 1K users (current) → 1M+ users (future)  
**Tech Stack:** Next.js + React + Supabase + PostgreSQL  

---

## Example Usage with Nano Banana

Copy the "Main Prompt for Diagram Generation" section above and paste it into Nano Banana or any AI diagram generation tool. Then request specific diagrams using the "Specific Diagram Requests" section.

For best results:
1. Start with Diagram 1 (Complete System Architecture)
2. Then create Diagrams 2-4 (Application, Data Flow, Integrations)
3. Finally create Diagrams 5-10 (Database, Real-time, Scalability, etc.)

---

**Document End**

*These diagrams will help visualize the UrbanOS architecture for documentation, presentations, and development planning.*
