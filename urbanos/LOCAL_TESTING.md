# Local Testing with Twilio Webhooks

Since Twilio cannot directly access `localhost`, you need to use a tunneling service to expose your local server to the internet.

## Quick Setup with ngrok

### Step 1: Install ngrok

**Option A: Download**
- Visit: https://ngrok.com/download
- Download and extract ngrok
- Add to your PATH or place in project folder

**Option B: npm (if you have npm)**
```bash
npm install -g ngrok
```

### Step 2: Start Your Dev Server

```bash
cd urbanos
npm run dev
```

Your server should be running on `http://localhost:3000`

### Step 3: Start ngrok Tunnel

Open a **new terminal/command prompt** and run:

```bash
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       (your account)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok.io -> http://localhost:3000

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important:** Copy the `Forwarding` URL (the `https://` one). This is your public URL!

### Step 4: Configure Twilio Webhook

1. Go to **Twilio Console**: https://console.twilio.com/
2. Navigate to **Messaging** → **Settings** → **WhatsApp Sandbox Settings**
3. Find the webhook configuration section
4. Set the webhook URL to:
   ```
   https://abc123def456.ngrok.io/api/webhooks/whatsapp
   ```
   (Replace with your actual ngrok URL)
5. Set HTTP method to: **POST**
6. Click **Save**

### Step 5: Test

1. Send a WhatsApp message to your Twilio sandbox number
2. Check your terminal running `npm run dev` - you should see logs
3. Check the ngrok web interface at `http://127.0.0.1:4040` to see incoming requests

## Important Notes

### Free ngrok Limitations

- **URL changes on restart**: Each time you restart ngrok, you get a new URL
- **Need to update Twilio**: You'll need to update the webhook URL in Twilio each time
- **Timeout after inactivity**: Free tier may timeout after inactivity

### Paid ngrok Benefits

- **Fixed domain**: You can reserve a domain name
- **No timeout**: Always-on tunneling
- **Better for production testing**

### Alternative: Use ngrok Auth Token (Free)

1. Sign up at https://dashboard.ngrok.com/signup (free)
2. Get your auth token
3. Run: `ngrok config add-authtoken YOUR_TOKEN`
4. This gives you longer sessions and better stability

## Other Tunneling Options

### Cloudflare Tunnel (free, no signup needed)

```bash
# Install cloudflared
# Then run:
cloudflared tunnel --url http://localhost:3000
```

### localtunnel (npm package)

```bash
npm install -g localtunnel
lt --port 3000
```

### serveo (SSH-based, no install)

```bash
ssh -R 80:localhost:3000 serveo.net
```

## Troubleshooting

### Issue: Twilio returns 404

- Make sure ngrok is pointing to `http://localhost:3000` (not 3001 or other port)
- Check that your Next.js server is actually running
- Verify the webhook URL in Twilio ends with `/api/webhooks/whatsapp`

### Issue: ngrok URL changes every time

- Sign up for free ngrok account and add auth token (see above)
- Or use a paid ngrok plan for fixed domains

### Issue: Connection timeout

- Make sure ngrok process is still running
- Restart ngrok if needed
- Check internet connection

### Issue: Twilio can't verify webhook

- Make sure you're using the HTTPS URL (not HTTP)
- Check that the GET endpoint returns 200 OK
- Verify the webhook URL is publicly accessible

## For Production

For production, **deploy to Vercel** instead of using ngrok:

1. Deploy to Vercel (see previous instructions)
2. Use your Vercel URL: `https://your-app.vercel.app/api/webhooks/whatsapp`
3. This is permanent and doesn't change

## Quick Checklist

- [ ] ngrok installed
- [ ] Next.js dev server running on port 3000
- [ ] ngrok tunnel running and showing HTTPS URL
- [ ] Twilio webhook configured with ngrok URL
- [ ] Test message sent via WhatsApp
- [ ] Check logs in terminal and ngrok web interface

