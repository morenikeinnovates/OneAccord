# OneAccord Quick Start Guide

Get OneAccord up and running in 5 minutes.

## 🚀 Super Quick (2 min)

Already have Supabase and want to deploy immediately?

```bash
# 1. Clone repo
git clone <repo-url>
cd oneaccord

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase keys

# 3. Install & run
npm install
npm run dev

# 4. Open http://localhost:3000
```

## 🛠️ Full Setup (5 min)

New to OneAccord? Follow these steps in order.

### Step 1: Supabase Setup (2 min)

1. **Create Supabase account** (if needed)
   - Go to https://supabase.com
   - Click "Start your project"
   - Create new project

2. **Initialize database**
   - Open your Supabase project
   - Go to SQL Editor
   - Click "New Query"
   - Copy entire contents of `scripts/supabase-schema.sql`
   - Paste into editor and click Run
   - Wait for success

3. **Enable authentication**
   - Go to Authentication > Providers
   - Enable "Email"
   - Enable "Magic Link"

4. **Copy your keys**
   - Settings > API
   - Copy Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy Anon Key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy Service Role Key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2: Local Development (1 min)

```bash
# Clone repository
git clone <repo-url>
cd oneaccord

# Set up environment
cp .env.example .env.local

# Edit .env.local
# Paste your three Supabase keys from Step 1

# Install dependencies
npm install

# Run development server
npm run dev
```

Visit `http://localhost:3000` in your browser.

### Step 3: Test It! (1 min)

1. **Sign in**
   - Enter your email
   - Check inbox for magic link
   - Click link

2. **Try a session**
   - Select "Foundation" category
   - Click "Deep Dive"
   - Answer a few questions
   - Click "Save & Next"

3. **Create a couple** (optional)
   - Go to "Link with Partner" tab
   - Click "Generate Code"
   - Share code with partner

## 📱 Test With Two Accounts

Want to test couple functionality?

1. **First account**
   - Sign in with your email
   - Generate coupling code
   - Copy the 6-letter code

2. **Second account**
   - Open private/incognito window
   - Sign in with different email
   - Go to "Link with Partner"
   - Enter the 6-letter code
   - Click "Connect"

3. **Run a session together**
   - Both sign in
   - Select same category
   - Each completes "My Story"
   - View "Your Story" (partner's answers)
   - Find alignment in "Find Our Middle"

## 🚀 Deploy to Vercel (2 min)

Ready for production?

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "OneAccord setup complete"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com/dashboard
   - Click "New Project"
   - Select your GitHub repo
   - Click "Import"

3. **Add environment variables**
   - Settings > Environment Variables
   - Add three variables:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - `SUPABASE_SERVICE_ROLE_KEY`
   - Click "Deploy"

4. **Done!**
   - Your site is live at `https://oneaccord-xxx.vercel.app`

## 🔍 Verify Everything Works

### ✅ Checklist

- [ ] Sign in works with magic link
- [ ] Magic link arrives in email
- [ ] Dashboard loads after sign in
- [ ] Can start a session
- [ ] Can save responses
- [ ] Can view session progress
- [ ] Can generate coupling code
- [ ] Can join couple with code
- [ ] Can see partner's responses
- [ ] All pages are styled correctly
- [ ] Mobile view is responsive

### ❌ Common Issues

**"No email received"**
- Check spam folder
- Try requesting new link
- Check email address is correct

**"Supabase connection error"**
- Verify environment variables
- Check keys are correct
- Ensure Supabase project is active

**"Profile not found"**
- Refresh page
- Clear cookies
- Sign in again

**"Can't see partner's data"**
- Make sure couple is linked (status = active)
- Check both users signed in with linked accounts
- Refresh page

## 📚 Next Steps

### Learn More
- **API Docs** → See `API_REFERENCE.md`
- **Setup Guide** → See `SETUP.md`
- **Deployment** → See `DEPLOYMENT.md`
- **Full README** → See `README.md`

### Customize
- **Add more categories** → Edit `lib/sessions-data.ts`
- **Change colors** → Edit `tailwind.config.js`
- **Modify questions** → Edit `lib/sessions-data.ts`

### Scale
- **Add more users** → Just share the URL
- **Monitor usage** → Check Vercel & Supabase dashboards
- **Improve performance** → Enable Supabase read replicas

## 🎯 Common Workflows

### Add New Conversation Category

```typescript
// In lib/sessions-data.ts
const CATEGORIES: SessionCategory[] = [
  // ... existing categories
  {
    key: 'new-topic',
    name: 'New Topic Name',
    emoji: '🎯',
    desc: 'Description of this topic',
    sessions: [
      {
        id: 's1',
        title: 'Session 1 Title',
        sub: 'Subtitle',
        questions: {
          mystory: ['Question 1?', 'Question 2?'],
          yourstory: ['Question 1?', 'Question 2?'],
          middle: ['Question 1?', 'Question 2?']
        }
      }
    ]
  }
];
```

### Add New User
- Just share the URL
- They sign in with email
- Profile auto-created

### Export Data
- Go to `/admin` (admin users only)
- Download from admin dashboard
- Or query Supabase directly

## 🆘 Need Help?

1. **Check the guides**
   - SETUP.md - Full setup instructions
   - DEPLOYMENT.md - Deployment guide
   - API_REFERENCE.md - API documentation

2. **Check error logs**
   - Browser console (F12)
   - Vercel dashboard > Logs
   - Supabase dashboard > Logs

3. **Debug in browser**
   - Right-click > Inspect > Console
   - Look for error messages
   - Copy full error text

4. **Check database**
   - Supabase > Table Editor
   - Verify data is saving
   - Check for RLS errors

## 📞 Support Resources

- **Supabase Docs** → https://supabase.com/docs
- **Next.js Docs** → https://nextjs.org/docs
- **Vercel Docs** → https://vercel.com/docs
- **Tailwind CSS** → https://tailwindcss.com/docs

## 🎉 Success!

You now have a fully functional couple's conversation platform running locally or on Vercel. Share the link with your users and start building deeper connections!

**Happy conversations! 💬**

---

**Questions?** Check README.md or SETUP.md for detailed information.
