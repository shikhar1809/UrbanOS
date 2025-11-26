# Test OAuth Sign-In After Migration

## Steps to Test

1. **Clear Browser Cache/Cookies** (Important!)
   - Open DevTools (F12)
   - Application tab → Clear storage → Clear site data
   - OR use Incognito/Private window

2. **Test Google Sign-In**
   - Go to http://localhost:3000
   - Click "Sign In" 
   - Click "Continue with Google"
   - Select your Google account
   - Should redirect back and show you as signed in

3. **Verify Profile Creation**
   - After signing in, check if your profile appears
   - Open DevTools Console (F12)
   - Should NOT see "Database error saving new user"
   - Should see successful authentication logs

## What Should Happen

✅ No "Database error saving new user" error  
✅ User profile created automatically  
✅ Redirected back to landing page  
✅ Signed in state shows your profile  

## If Still Not Working

1. **Check Browser Console** for any errors
2. **Check Supabase Logs**: 
   - Dashboard → Logs → Postgres Logs
   - Look for errors related to `handle_new_user`
3. **Verify Migration Applied**:
   - Run in SQL Editor:
     ```sql
     SELECT * FROM pg_policies WHERE tablename = 'users';
     ```
   - Should see "Allow user profile creation via trigger" policy

