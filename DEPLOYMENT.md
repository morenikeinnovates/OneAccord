# OneAccord Deployment Guide

This guide walks you through deploying OneAccord to production on Vercel.

## Prerequisites

Before deploying, ensure you have:
- ✅ Supabase project created with database schema initialized
- ✅ Supabase authentication configured with magic links
- ✅ GitHub repository connected (or will connect during setup)
- ✅ Vercel account

## Step 1: Prepare Your Code

### Option A: Deploy from GitHub (Recommended)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial OneAccord setup"
   git push origin main
   ```

2. **Ensure .env variables are NOT committed**
   - Check `.gitignore` includes `.env.local`
   - Never commit secrets to GitHub

### Option B: Deploy from Local

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```

## Step 2: Set Up Database

### In Supabase Console

1. **Go to your Supabase project**
   - https://app.supabase.com

2. **Open SQL Editor**
   - Click "New Query"

3. **Copy and paste schema**
   ```sql
   -- Copy entire contents of scripts/supabase-schema.sql
   ```

4. **Execute**
   - Click Run
   - Wait for completion
   - You should see: "Success. No rows returned"

### Verify Tables Created

1. **Go to Table Editor** in Supabase
2. **Check these tables exist**
   - profiles
   - couples
   - sessions
   - responses
   - declarations
   - session_attempts

## Step 3: Configure Authentication

### Email Provider Setup

1. **In Supabase: Authentication > Providers**
2. **Enable Email**
   - Toggle "Email" to ON
   - Enable "Confirm email"
3. **Enable Magic Link**
   - Under Email settings
   - Enable "Magic Link" (passwordless)

### Email Templates (Optional)

1. **Go to Email Templates**
2. **Customize if desired** (optional)
   - Templates are pre-configured
   - Customize branding/messaging if needed

## Step 4: Get Environment Variables

### From Supabase

1. **Go to Settings > API**
2. **Copy these values:**
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon Key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Service Role Key** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Keep these secret!** Only share the Anon Key in public code.

## Step 5: Add Environment Variables to Vercel

### Method 1: From Vercel Dashboard

1. **Go to your Vercel project**
   - https://vercel.com/dashboard

2. **Click Settings**
   - Top right corner

3. **Go to Environment Variables**
   - Scroll down or search for "Environment Variables"

4. **Add each variable:**
   - Name: `NEXT_PUBLIC_SUPABASE_URL`
   - Value: (paste your Supabase URL)
   - Click "Add"

5. **Repeat for:**
   ```
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

6. **Redeploy**
   - Vercel will automatically redeploy
   - Or manually trigger from Deployments tab

### Method 2: From Vercel CLI

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel redeploy
```

## Step 6: Verify Deployment

### Check Live Site

1. **Open your Vercel deployment URL**
   - Format: `https://oneaccord-xyz.vercel.app`
   - Or custom domain if configured

2. **Test Sign In**
   - Enter your email
   - Check your inbox for magic link
   - Click link to authenticate
   - Should see dashboard

### Debug Issues

**If you see errors:**

1. **Check Vercel Logs**
   - Project > Deployments > click latest
   - Click "Logs" tab
   - Look for error messages

2. **Check Function Logs**
   - Click "Function Logs" tab
   - See what API routes are doing

3. **Check Console (Browser)**
   - Right-click > Inspect
   - Console tab
   - Look for JavaScript errors

## Step 7: Configure Custom Domain (Optional)

1. **In Vercel Project Settings**
   - Scroll to "Domains"
   - Click "Add Domain"
   - Enter your domain (e.g., oneaccord.com)

2. **Update DNS**
   - Vercel shows DNS records to add
   - Add to your domain registrar
   - Wait 5-30 minutes for propagation

3. **Enable SSL**
   - Automatic with Vercel

## Step 8: Set Up Admin Access

### Create Admin User

1. **Add yourself as admin in Supabase**
   - Go to Authentication > Users
   - Create user with your email
   - Confirm email

2. **Add admin role** (Optional)
   - SQL Query:
   ```sql
   UPDATE public.profiles 
   SET is_admin = true 
   WHERE email = 'your@email.com';
   ```
   - Note: You may need to add is_admin column first:
   ```sql
   ALTER TABLE public.profiles 
   ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
   ```

3. **Access admin dashboard**
   - Sign in
   - Go to `/admin`

## Step 9: Post-Deployment Checklist

- [ ] Sign in works with magic link
- [ ] Can create couple and enter code
- [ ] Can start a session
- [ ] Can save responses
- [ ] Can view partner's responses (if linked)
- [ ] AI declaration generation works
- [ ] Admin dashboard accessible
- [ ] All pages load without errors
- [ ] Mobile responsive design works

## Troubleshooting

### "Supabase connection refused"
**Solution:**
- Check environment variables are set
- Verify URL and keys are correct
- Check Supabase project is active

### "Profile not found" after sign in
**Solution:**
- Check auth callback route is working
- Check profiles table was created
- Verify RLS policies allow INSERT

### "Magic link not working"
**Solution:**
- Check email provider enabled in Supabase
- Check email templates configured
- Try requesting new link (24 hour expiry)

### "White page / 500 error"
**Solution:**
- Check Vercel function logs
- Check browser console
- Verify all environment variables set

### "Can't see partner's data"
**Solution:**
- Ensure couple is properly linked (status = 'active')
- Check RLS policies allow viewing partner data
- Verify couple_id is set in both profiles

### "AI declarations timeout"
**Solution:**
- Check AI_GATEWAY_API_KEY if using custom provider
- Longer responses may take 30+ seconds
- Check Vercel function logs for errors

## Performance Optimization

### Database
- Indexes are created automatically
- Consider enabling Supabase query performance monitoring

### Images
- Use Next.js Image component
- Configure image optimization

### Caching
- Session data cached with SWR on client
- API responses cached appropriately

## Security Checklist

- [ ] Environment variables not in git
- [ ] Supabase RLS policies enforced
- [ ] Magic links use secure tokens
- [ ] Sensitive data in HTTP-only cookies
- [ ] CORS configured (if using external APIs)
- [ ] Rate limiting on API routes (optional)

## Monitoring & Maintenance

### Monitor in Vercel
- **Analytics** tab shows page performance
- **Logs** show function execution
- **Deployments** show rollback history

### Monitor in Supabase
- **Database** > Inspect usage
- **Authentication** > Check active users
- **SQL Editor** > Monitor slow queries

### Useful Dashboards
- Vercel: https://vercel.com/dashboard
- Supabase: https://app.supabase.com
- Project Home: (your deployed URL)

## Rollback Procedure

If deployment has issues:

1. **In Vercel Dashboard**
   - Go to Deployments
   - Click previous working deployment
   - Click "Promote to Production"

2. **Or redeploy**
   ```bash
   git revert <problematic-commit>
   git push origin main
   ```

## Next Steps

1. **Invite users**
   - Share deployment URL
   - Send signup link

2. **Gather feedback**
   - Monitor usage patterns
   - Collect user feedback

3. **Iterate**
   - Add new topics/sessions
   - Improve UI based on feedback
   - Scale database as needed

## Support

For issues:
1. Check Vercel logs
2. Check Supabase dashboard
3. Review browser console
4. Check this guide's troubleshooting section

---

**Deployment complete! OneAccord is live.**
