# Add Environment Variables to Vercel

## Option 1: Via Vercel Dashboard (Easiest) ⭐ RECOMMENDED

1. Go to: https://vercel.com/dashboard
2. Click on your project: **urbanos** (or **UrbanOS_Hack_Beyond_SRMCEM**)
3. Go to **Settings** → **Environment Variables**
4. Add each variable below, one by one:

### Copy and paste these variables:

**Variable 1:**
- Key: `NEXT_PUBLIC_SUPABASE_URL`
- Value: `https://iredygbhjgqcvekjlrrl.supabase.co`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 2:**
- Key: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 3:**
- Key: `METASOURCE_API_KEY`
- Value: `l9m0kupv8gfjfb4qk9snkw3mu0ti0pzvpk3yw66f`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 4:**
- Key: `DATA_GOV_IN_API_KEY`
- Value: `579b464db66ec23bdd0000019779c845298b477271ef862e22055b68`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 5:**
- Key: `RESEND_API_KEY`
- Value: `re_L1sRiZZe_BLgf5zgUhmohWXaTd6QedN5y`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 6:**
- Key: `RESEND_FROM_EMAIL`
- Value: `onlyafterburners@gmail.com`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 7:**
- Key: `TWILIO_ACCOUNT_SID`
- Value: `YOUR_TWILIO_ACCOUNT_SID` (Get from Twilio Dashboard)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 8:**
- Key: `TWILIO_AUTH_TOKEN`
- Value: `YOUR_TWILIO_AUTH_TOKEN` (Get from Twilio Dashboard)
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 9:**
- Key: `TWILIO_WHATSAPP_NUMBER`
- Value: `whatsapp:+14155238886`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 10:**
- Key: `NEXT_PUBLIC_APP_URL`
- Value: `https://urbanos-nqbdgts6l-royalshikher-4385s-projects.vercel.app`
- Environments: ✅ Production, ✅ Preview, ✅ Development

**Variable 11 (Optional - if you have it):**
- Key: `SUPABASE_SERVICE_ROLE_KEY`
- Value: `(get this from Supabase Dashboard → Settings → API → service_role key)`
- Environments: ✅ Production, ✅ Preview, ✅ Development

5. After adding all variables, go to **Deployments** tab
6. Click **⋯** on latest deployment → **Redeploy**

---

## Option 2: Via Vercel CLI (Interactive)

Run these commands one by one (you'll be prompted to enter values):

```bash
cd urbanos
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# When prompted, paste: https://iredygbhjgqcvekjlrrl.supabase.co
# Repeat for preview and development

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Paste the anon key value

# ... continue for each variable
```

---

## Quick Deploy After Adding Variables

Once you've added the environment variables (via dashboard is easier):

```bash
cd urbanos
vercel --prod --yes
```

