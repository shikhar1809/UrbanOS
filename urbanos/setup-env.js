const fs = require('fs');
const path = require('path');

const envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://iredygbhjgqcvekjlrrl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlyZWR5Z2JoamdxY3Zla2pscnJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3MzU0OTAsImV4cCI6MjA3OTMxMTQ5MH0.rLki_bdI8B3nGwrSajJaltaatfoUeAToG2rp3SvhjDM

# Social Media Integration (Optional - configure these later if needed)
INSTAGRAM_VERIFY_TOKEN=urbanos_verify_token
INSTAGRAM_ACCESS_TOKEN=
WHATSAPP_VERIFY_TOKEN=urbanos_verify_token
WHATSAPP_ACCESS_TOKEN=
TWITTER_API_KEY=
TWITTER_API_SECRET=
TWITTER_BEARER_TOKEN=
`;

const envPath = path.join(__dirname, '.env.local');

fs.writeFileSync(envPath, envContent, 'utf8');
console.log('✅ .env.local file created successfully!');
console.log('📁 Location:', envPath);
console.log('\n🚀 You can now run: npm run dev');

