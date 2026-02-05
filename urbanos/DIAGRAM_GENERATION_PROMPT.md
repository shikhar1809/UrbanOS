# UrbanOS - Architectural Diagram Generation Prompt

## 🎯 Quick Start for Nano Banana

**IMPORTANT INSTRUCTIONS:**
1. ✅ Use EXACT spelling for all technical terms
2. ✅ Double-check all component names before generating
3. ✅ Verify technology names (Next.js, PostgreSQL, Supabase, etc.)
4. ✅ Use proper capitalization (API not api, WebSocket not websocket)

---

## 📋 Main Prompt (Copy This)

```
Create a professional system architecture diagram for UrbanOS civic platform.

CRITICAL: Use EXACT spelling - Next.js, PostgreSQL, Supabase, WebSocket, Kubernetes, Redis

LAYERS (top to bottom):

1. CLIENT: Web App (Next.js 16, React 19), Mobile Browsers, Social Media (Instagram, WhatsApp, Twitter)

2. PRESENTATION: Windows 11 OS Interface - Taskbar, Desktop, 11 App Windows, Settings

3. APPLICATIONS (11 apps):
   - Reports, Community, Pollution Monitor, Issue Predictor
   - Security, Alerts, Admin Panel, UrbanMind AI
   - CityMonitor 3D, Profile, Notifications

4. API: Next.js Routes - /api/reports, /api/weather, /api/air-quality, /api/predictor, /api/chat, /api/webhooks

5. INTEGRATIONS:
   - Supabase (Database + Auth + Storage)
   - Google Gemini AI
   - Weather APIs, Air Quality APIs
   - Twilio (SMS, Voice, WhatsApp)
   - Instagram API, Twitter API

6. DATA: PostgreSQL 15 + PostGIS, Supabase Storage, Real-time Subscriptions, Row Level Security

7. FUTURE SCALE: Redis Cluster, Message Queue, WebSocket Cluster, Load Balancer, CDN, Kubernetes (10-100 pods)

COLOR CODE:
- Blue: Client/Frontend
- Green: Backend/API
- Orange: External Services
- Purple: Database
- Red: Future/Scalability

Add arrows showing data flow. Use boxes for grouping. Label everything clearly.
```

---

## 🎨 Individual Diagram Prompts (Use One at a Time)

### Diagram 1: System Architecture
```
Create system architecture for UrbanOS. EXACT spelling required.

7 Layers (top to bottom):
1. Client: Web (Next.js), Mobile, Social Media
2. Presentation: Windows 11 UI, Taskbar, 11 Apps
3. Applications: Reports, Community, Pollution, Predictor, Security, Alerts, Admin, AI, 3D, Profile, Notifications
4. API: Next.js routes (/api/reports, /weather, /air-quality, /predictor, /chat, /webhooks)
5. Integration: Supabase, Google Gemini AI, Twilio, Weather APIs, Social APIs
6. Data: PostgreSQL + PostGIS, Supabase Storage, Real-time
7. Future: Redis, Queue, WebSocket, Load Balancer, CDN, Kubernetes

Colors: Blue (client), Green (backend), Orange (external), Purple (data), Red (future)
Add arrows for data flow. Label clearly.
```

### Diagram 2: Data Flow - Report Creation
```
Create sequence diagram for report creation. EXACT spelling.

Steps:
1. User fills form → Reports App
2. Upload images → Supabase Storage
3. Insert report → PostgreSQL
4. Real-time broadcast → Supabase Real-time
5. Notify agencies → Notifications
6. Agency updates status → PostgreSQL
7. User receives update → Real-time

Show timing and data at each step. Use proper names: Supabase, PostgreSQL.
```

### Diagram 3: Social Media Integration
```
Create flow diagram for social media integration. Check spelling.

3 Flows:
1. Instagram DM → Webhook → Parse → Create Report → Confirm
2. WhatsApp Message → Webhook → Parse → Create Report → Confirm
3. Twitter Mention → Webhook → Parse → Create Report → Confirm

Show webhook verification. Use: Instagram, WhatsApp, Twitter (exact spelling).
```

### Diagram 4: Database Schema
```
Create ER diagram for UrbanOS database. EXACT spelling.

Core Tables:
- users (id, email, role)
- reports (id, user_id, type, location, status)
- agencies (id, name, region)
- community_officials (id, name, role)
- alerts (id, type, severity)
- pollution_data (id, location, aqi_value)
- notifications (id, user_id, type)

Show primary keys (PK), foreign keys (FK), relationships (1:1, 1:N, N:M).
Use PostgreSQL terminology.
```

### Diagram 5: Future Scalability
```
Create scalability architecture. EXACT spelling required.

Components:
- CloudFlare CDN (global)
- Load Balancer
- API Servers (10-100 pods) - Kubernetes
- WebSocket Cluster (5-50 pods)
- Redis Cluster (caching)
- Message Queue (Redis Streams)
- PostgreSQL Primary + 3 Read Replicas
- S3 Storage

Show auto-scaling, data flow, caching layers.
Use: Kubernetes, Redis, PostgreSQL, CloudFlare (exact spelling).
```

### Diagram 6: Real-time Architecture
```
Create real-time data flow. Check spelling carefully.

Flow:
1. Database Change (INSERT/UPDATE/DELETE) → PostgreSQL
2. Detect Change → Supabase Real-time
3. Broadcast → WebSocket connections
4. Client Receives → Update state
5. Re-render UI → React

Show WebSocket connections, subscriptions.
Use: PostgreSQL, Supabase, WebSocket, React (exact spelling).
```

### Diagram 7: Multi-Layer Caching
```
Create caching architecture. EXACT spelling.

4 Cache Layers:
1. Browser Cache (30s TTL)
2. CDN Cache (10s TTL) - CloudFlare
3. Redis Cache (5s TTL)
4. PostgreSQL Query Cache

Show cache hit/miss flow, invalidation.
Use: CloudFlare, Redis, PostgreSQL (exact spelling).
```

### Diagram 8: Deployment Pipeline
```
Create CI/CD pipeline. Check spelling.

Steps:
1. Git Push → GitHub
2. Trigger → GitHub Actions
3. Tests → Lint, Type-check, Unit tests
4. Build → Next.js
5. Deploy → Vercel
6. Smoke Tests
7. Notify Team

Show parallel steps, failure handling.
Use: GitHub, Next.js, Vercel (exact spelling).
```

---

## ✅ Spelling Checklist

**ALWAYS use these EXACT spellings:**

### Technologies
- ✅ Next.js (NOT Nextjs, nextjs, or Next)
- ✅ PostgreSQL (NOT Postgres, postgres, or PostgreSql)
- ✅ Supabase (NOT SupaBase or supabase)
- ✅ WebSocket (NOT Websocket or websocket)
- ✅ Kubernetes (NOT kubernetes or K8s in diagrams)
- ✅ Redis (NOT redis)
- ✅ CloudFlare (NOT Cloudflare or cloudflare)
- ✅ JavaScript (NOT Javascript or javascript)
- ✅ TypeScript (NOT Typescript or typescript)

### Services
- ✅ Google Gemini AI (NOT Gemini or gemini)
- ✅ Twilio (NOT twilio)
- ✅ Instagram (NOT instagram)
- ✅ WhatsApp (NOT Whatsapp or whatsapp)
- ✅ Twitter (NOT twitter)

### Components
- ✅ API (NOT api or Api)
- ✅ CDN (NOT cdn)
- ✅ UI (NOT ui)
- ✅ OAuth (NOT oauth or Oauth)
- ✅ JWT (NOT jwt)

---

## 🎯 Tips for Best Results

1. **Use one prompt at a time** - Don't combine multiple diagrams
2. **Verify spelling** - Check all technical terms before generating
3. **Keep it simple** - Let the tool focus on structure, not details
4. **Iterate** - Generate, review, regenerate if needed
5. **Export high-res** - Use SVG or high-resolution PNG

---

## 📊 Recommended Order

1. Start with **Diagram 1** (System Architecture) - gives overview
2. Then **Diagram 2** (Data Flow) - shows key operations
3. Then **Diagram 3** (Social Media) - shows integrations
4. Then **Diagram 4** (Database) - shows data structure
5. Finally **Diagrams 5-8** - shows scalability and deployment

---

## Example Usage

**Step 1:** Copy "Diagram 1: System Architecture" prompt  
**Step 2:** Paste into Nano Banana  
**Step 3:** Verify all spellings are correct  
**Step 4:** Generate diagram  
**Step 5:** Export and save  
**Step 6:** Repeat for other diagrams  

---

**Remember:** Quality over quantity. Better to have 3 perfect diagrams than 10 with spelling errors!
