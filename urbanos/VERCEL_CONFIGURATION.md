# Vercel Configuration for https://urbanos-rho.vercel.app/

## ✅ Your Deployment URL
**Production URL:** `https://urbanos-rho.vercel.app/`

---

## Required Environment Variables in Vercel

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### 1. App URL (CRITICAL for OAuth)
```
NEXT_PUBLIC_APP_URL=https://urbanos-rho.vercel.app
```
**Important:** This must be set to fix the OAuth redirect issue!

### 2. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM
SUPABASE_SERVICE_ROLE_KEY=(your service role key from Supabase)
```

### 3. Weather & Air Quality APIs
```
METASOURCE_API_KEY=l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f
DATA_GOV_IN_API_KEY=579b464db66ec23bdd0000019779c845298b477271ef862e22055b68
```

### 4. Email Service
```
RESEND_API_KEY=re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y
RESEND_FROM_EMAIL=onlyafterburners@gmail.com
```

### 5. Twilio WhatsApp
```
TWILIO_ACCOUNT_SID=(your Twilio Account SID)
TWILIO_AUTH_TOKEN=(your Twilio Auth Token)
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 6. Social Media (Optional)
```
WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
```

**For all variables:** Enable for ✅ Production, ✅ Preview, ✅ Development

---

## Supabase OAuth Configuration

Go to: **Supabase Dashboard → Authentication → URL Configuration**

### Redirect URLs
Add these URLs:
```
https://urbanos-rho.vercel.app/auth/callback
https://urbanos-rho.vercel.app/*
```

### Site URL
Set to:
```
https://urbanos-rho.vercel.app
```

Click **Save**

---

## Twilio Webhook Configuration

Go to: **Twilio Console → WhatsApp Sandbox Settings**

### Webhook URL
Set to:
```
https://urbanos-rho.vercel.app/api/webhooks/whatsapp
```

---

## After Configuration

1. **Redeploy on Vercel:**
   - Go to Deployments → Click "⋯" → Redeploy
   - Wait for deployment to complete

2. **Test OAuth Sign-In:**
   - Visit: https://urbanos-rho.vercel.app/
   - Click "Sign In"
   - Should redirect back to Vercel (not localhost)

3. **Verify Reports Display:**
   - Visit: https://urbanos-rho.vercel.app/os
   - Reports should appear on the map

---

## Quick Checklist

- [ ] `NEXT_PUBLIC_APP_URL` set to `https://urbanos-rho.vercel.app` in Vercel
- [ ] All other environment variables added in Vercel
- [ ] Supabase redirect URLs configured
- [ ] Supabase Site URL set to `https://urbanos-rho.vercel.app`
- [ ] Twilio webhook URL configured (if using WhatsApp)
- [ ] Redeployed on Vercel
- [ ] Tested OAuth sign-in (should not redirect to localhost)
- [ ] Verified reports display on map

---

## Troubleshooting

### OAuth still redirects to localhost?
1. Verify `NEXT_PUBLIC_APP_URL` is set correctly in Vercel
2. Check Supabase redirect URLs include your Vercel URL
3. Clear browser cache and cookies
4. Redeploy on Vercel

### Reports not showing?
1. Run the RLS migration in Supabase (see `FIX_REPORTS_DISPLAY.md`)
2. Check browser console for errors
3. Verify Supabase environment variables are set

