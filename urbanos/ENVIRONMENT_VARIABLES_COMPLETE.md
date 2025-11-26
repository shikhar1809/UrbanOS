# Complete Environment Variables Reference

## 📋 All Required Environment Variables

### 🔴 **CRITICAL - Required for Basic Functionality**

#### 1. **Supabase Configuration** (Database & Authentication)
```env
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
SUPABASE_SERVICE_ROLE_KEY=(get from Supabase Dashboard → Settings → API → service_role key)
```
**Purpose:** Database connection, authentication, and admin operations  
**Where to get:** Supabase Dashboard → Settings → API  
**Required for:** User authentication, database queries, admin functions

#### 2. **App URL** (OAuth & Email Links)
```env
# For Local Development:
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For Production (Vercel):
NEXT_PUBLIC_APP_URL=https://urbanos-rho.vercel.app
```
**Purpose:** OAuth redirects, email links, tracking pixels  
**Where to get:** Your deployment URL  
**Required for:** OAuth sign-in, email notifications, report links

---

### 🟡 **IMPORTANT - Required for Core Features**

#### 3. **Weather API** (Metasource)
```env
METASOURCE_API_KEY=l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f
```
**Purpose:** Real-time weather data display  
**Where to get:** Metasource API (already configured)  
**Required for:** Weather widget on OS page

#### 4. **Air Quality API** (data.gov.in)
```env
DATA_GOV_IN_API_KEY=579b464db66ec23bdd0000019779c845298b477271ef862e22055b68
```
**Purpose:** Real-time air quality data  
**Where to get:** data.gov.in API (already configured)  
**Required for:** Pollution app, air quality display

#### 5. **Email Service** (Resend)
```env
RESEND_API_KEY=re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y
RESEND_FROM_EMAIL=onlyafterburners@gmail.com
```
**Purpose:** Sending email notifications  
**Where to get:** Resend Dashboard → API Keys  
**Required for:** Email notifications, community report emails, PIL document emails

---

### 🟢 **OPTIONAL - For Advanced Features**

#### 6. **Twilio WhatsApp Integration**
```env
TWILIO_ACCOUNT_SID=(get from Twilio Console → Account Info)
TWILIO_AUTH_TOKEN=(get from Twilio Console → Account Info)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```
**Purpose:** WhatsApp report creation via messages  
**Where to get:** Twilio Console → Account Info  
**Required for:** WhatsApp webhook integration

#### 7. **Social Media Webhooks** (Optional)
```env
WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_ACCESS_TOKEN=(get from Instagram Developer Portal)
WHATSAPP_ACCESS_TOKEN=(if using Meta WhatsApp Business API)
```
**Purpose:** Webhook verification for social media integrations  
**Where to get:** Create your own tokens (any string)  
**Required for:** Instagram/WhatsApp webhook verification

#### 8. **Twitter/X Integration** (Optional)
```env
TWITTER_API_KEY=(get from Twitter Developer Portal)
TWITTER_API_SECRET=(get from Twitter Developer Portal)
TWITTER_BEARER_TOKEN=(get from Twitter Developer Portal)
```
**Purpose:** Twitter/X report creation  
**Where to get:** Twitter Developer Portal  
**Required for:** Twitter webhook integration

---

## 📝 Complete .env.local Template

Copy this to `urbanos/.env.local` for local development:

```env
# ============================================
# SUPABASE CONFIGURATION (REQUIRED)
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# ============================================
# APP URL (REQUIRED)
# ============================================
# Local Development:
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Production (update after deployment):
# NEXT_PUBLIC_APP_URL=https://urbanos-rho.vercel.app

# ============================================
# WEATHER & AIR QUALITY APIs (REQUIRED)
# ============================================
METASOURCE_API_KEY=l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f
DATA_GOV_IN_API_KEY=579b464db66ec23bdd0000019779c845298b477271ef862e22055b68

# ============================================
# EMAIL SERVICE (REQUIRED)
# ============================================
RESEND_API_KEY=re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y
RESEND_FROM_EMAIL=onlyafterburners@gmail.com

# ============================================
# TWILIO WHATSAPP (OPTIONAL)
# ============================================
TWILIO_ACCOUNT_SID=(get from Twilio Console → Account Info)
TWILIO_AUTH_TOKEN=(get from Twilio Console → Account Info)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# ============================================
# SOCIAL MEDIA WEBHOOKS (OPTIONAL)
# ============================================
WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_ACCESS_TOKEN=
WHATSAPP_ACCESS_TOKEN=

# ============================================
# TWITTER/X INTEGRATION (OPTIONAL)
# ============================================
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
```

---

## 🚀 Vercel Environment Variables Setup

### Quick Copy-Paste for Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these one by one (enable for ✅ Production, ✅ Preview, ✅ Development):

| Variable Name | Value | Required |
|--------------|-------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://iredygbhjgqcvekjlrrl.supabase.co` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase Dashboard) | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | `https://urbanos-rho.vercel.app` | ✅ Yes |
| `METASOURCE_API_KEY` | `l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f` | ✅ Yes |
| `DATA_GOV_IN_API_KEY` | `579b464db66ec23bdd0000019779c845298b477271ef862e22055b68` | ✅ Yes |
| `RESEND_API_KEY` | `re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y` | ✅ Yes |
| `RESEND_FROM_EMAIL` | `onlyafterburners@gmail.com` | ✅ Yes |
| `TWILIO_ACCOUNT_SID` | (get from Twilio Console) | ⚠️ Optional |
| `TWILIO_AUTH_TOKEN` | (get from Twilio Console) | ⚠️ Optional |
| `TWILIO_WHATSAPP_NUMBER` | `whatsapp:+14155238886` | ⚠️ Optional |
| `WHATSAPP_VERIFY_TOKEN` | `urbanos_verify_token` | ⚠️ Optional |
| `INSTAGRAM_VERIFY_TOKEN` | `urbanos_verify_token` | ⚠️ Optional |

---

## 📍 Where to Get Each Variable

### Supabase Variables
1. Go to: https://supabase.com/dashboard/project/iredygbhjgqcvekjlrrl
2. **Settings** → **API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ Keep secret!)

### App URL
- **Local:** `http://localhost:3000`
- **Production:** Your Vercel URL (e.g., `https://urbanos-rho.vercel.app`)

### Weather & Air Quality
- Already configured (keys provided above)

### Email Service (Resend)
1. Go to: https://resend.com/api-keys
2. Create or copy API key → `RESEND_API_KEY`
3. Use your verified email → `RESEND_FROM_EMAIL`

### Twilio WhatsApp
1. Go to: https://console.twilio.com/
2. **Account Info** → Copy:
   - **Account SID** → `TWILIO_ACCOUNT_SID`
   - **Auth Token** → `TWILIO_AUTH_TOKEN`
3. **WhatsApp Sandbox** → Copy number → `TWILIO_WHATSAPP_NUMBER`

### Social Media Tokens
- Create your own random strings for verify tokens
- Access tokens from respective developer portals (if using)

---

## ✅ Verification Checklist

### Local Development
- [ ] `.env.local` file created in `urbanos/` folder
- [ ] All required variables added
- [ ] Server starts without errors
- [ ] Can sign in with Google
- [ ] Reports display on map

### Vercel Production
- [ ] All environment variables added in Vercel dashboard
- [ ] Variables enabled for Production, Preview, Development
- [ ] `NEXT_PUBLIC_APP_URL` set to production URL
- [ ] Supabase redirect URLs configured
- [ ] Deployment successful
- [ ] OAuth sign-in works (doesn't redirect to localhost)
- [ ] Reports display on map

---

## 🔒 Security Notes

1. **Never commit `.env.local` to Git** (already in `.gitignore`)
2. **Service Role Key is sensitive** - only use server-side
3. **API keys should be kept secret**
4. **Use different keys for development and production**

---

## 🆘 Troubleshooting

### "Missing environment variable" error
- Check variable name spelling (case-sensitive)
- Verify variable is added in Vercel
- Ensure it's enabled for the correct environment

### OAuth redirects to localhost
- Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
- Configure Supabase redirect URLs
- Redeploy

### Reports not showing
- Verify Supabase variables are correct
- Check RLS policies (run migration)
- Check browser console for errors

---

## 📚 Related Documentation

- `VERCEL_CONFIGURATION.md` - Vercel-specific setup
- `FIX_OAUTH_REDIRECT.md` - OAuth troubleshooting
- `FIX_REPORTS_DISPLAY.md` - Reports display issues
- `ADD_VERCEL_ENV_VARS.md` - Quick Vercel setup

