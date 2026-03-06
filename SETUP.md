# OneAccord Platform - Setup Guide

## Overview

OneAccord is a faith-based guided conversation platform for couples at different relationship stages (dating, engaged, married). It uses Supabase for authentication and data storage, with AI-powered declaration generation.

## Prerequisites

1. **Vercel Account** - for deployment
2. **Supabase Account** - for database and authentication
3. **Node.js 18+** - for local development
4. **Environment Variables** - from your Supabase project

## Step 1: Supabase Setup

### Create Tables in Supabase

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `/scripts/supabase-schema.sql`
5. Paste into the SQL editor
6. Click **Run** to execute

This creates:
- `profiles` - User information and relationship stage
- `couples` - Links two users together
- `sessions` - Conversation sessions by category
- `responses` - User answers during sessions
- `declarations` - Generated couple declarations
- `session_attempts` - History of completed sessions

### Enable Authentication

1. In Supabase, go to **Authentication > Providers**
2. Enable **Email** provider
3. Enable **Magic Link** (for passwordless login)
4. Go to **Email Templates** and customize if desired

## Step 2: Environment Variables

In Vercel, add these environment variables:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

You can find these in Supabase:
- **Settings > API** - Copy your project URL and API keys

## Step 3: Deploy to Vercel

```bash
git push origin main
```

The app will automatically:
1. Install dependencies
2. Build the Next.js app
3. Deploy to Vercel

## Features

### For Users (Couples)

1. **Sign In** - Magic link authentication via email
2. **Link with Partner** - Generate code or enter partner's code
3. **Guided Sessions** - Work through 10 conversation categories:
   - Foundation
   - Faith
   - Communication
   - Conflict Resolution
   - Money
   - Career
   - Intimacy
   - Family
   - Kids
   - Legacy

4. **Two Modes**
   - **Deep Dive** - Full conversation with detailed questions
   - **Flash Cards** - Quick yes/no questions

5. **Three Steps Per Session**
   - My Story - Share your perspective
   - Your Story - Read partner's perspective
   - Find Our Middle - Identify common ground

6. **AI Declarations** - Generate a couple declaration after completing a session
   - AI drafts based on your responses
   - Both partners review and approve
   - Sealed as a keepsake

### For Admins

Access the admin dashboard at `/admin` (with admin role):
- View all users and couples
- Track session completion
- Monitor declarations
- Generate reports
- Export data

## Architecture

### Frontend
- Next.js 15 with App Router
- TypeScript for type safety
- Tailwind CSS for styling
- Client and Server Components

### Backend
- Next.js API Routes
- Supabase PostgreSQL
- Row Level Security (RLS) for data protection

### Authentication
- Supabase Auth with Magic Links
- Session-based security

### AI
- Vercel AI SDK 6
- Claude for declaration generation

## Database Schema

### Relationships
```
auth.users
    ↓
profiles (user data)
    ↓
couples (links two profiles)
    ↓
sessions (created by profile)
    ↓
responses (answers to questions)
    ↓
declarations (couple declarations)
    ↓
session_attempts (history)
```

### Row Level Security

- Users can only view/edit their own data
- Partners can view each other's responses in shared sessions
- Admins have full access with service role key

## API Endpoints

### Authentication
- `POST /auth/callback` - Handle OAuth callback

### Sessions
- `GET /api/sessions` - Get user's sessions
- `POST /api/sessions` - Create new session
- `GET /api/sessions/:id` - Get session details

### Responses
- `POST /api/responses` - Save response
- `GET /api/responses?sessionId=X` - Get responses for session

### Couples
- `POST /api/couples/generate-code` - Generate coupling code
- `POST /api/couples/join` - Join couple with code
- `GET /api/couples/:id` - Get couple details

### Declarations
- `POST /api/declarations/generate` - Generate AI declaration (streaming)
- `GET /api/declarations` - Get declarations
- `POST /api/declarations/:id/approve` - Approve declaration
- `POST /api/declarations/:id/seal` - Seal declaration

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/couples` - List all couples
- `GET /api/admin/sessions` - List all sessions

## Development

### Local Setup

```bash
# Clone repository
git clone <repo-url>
cd oneaccord

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Visit `http://localhost:3000`

### Project Structure

```
app/
  ├── page.tsx              # Landing page
  ├── session/page.tsx      # Session UI
  ├── declarations/page.tsx # Declaration review
  ├── admin/page.tsx        # Admin dashboard
  ├── api/
  │   ├── sessions/         # Session CRUD
  │   ├── responses/        # Response storage
  │   ├── couples/          # Couple linking
  │   ├── declarations/     # Declaration generation
  │   └── admin/            # Admin operations
  └── layout.tsx            # Root layout

components/
  ├── SignIn.tsx            # Auth component
  ├── Dashboard.tsx         # Main user dashboard
  └── CoupleLink.tsx        # Couple linking UI

lib/
  ├── supabase.ts          # Supabase client
  ├── types.ts             # TypeScript types
  ├── sessions-data.ts     # Category & question data
  └── admin.ts             # Admin helpers
```

## Troubleshooting

### "No session found"
- Make sure you've signed in with magic link
- Check that your Supabase auth is properly configured

### "Profile not found"
- The profile is created automatically on first sign-in
- Check `/api/auth/callback` is handling the auth properly

### "Couple code invalid"
- Codes are generated randomly and expire after 7 days
- Generate a new code if the old one doesn't work

### "Can't see partner's responses"
- Make sure you're properly linked as a couple
- Check the `couples` table in Supabase to confirm the link

### "AI declaration not generating"
- Check environment variables are set in Vercel
- Verify AI_GATEWAY_API_KEY is configured for AI SDK
- Check browser console for error details

## Next Steps

1. Deploy to Vercel
2. Test sign-in flow with magic links
3. Create a couple and run through a session
4. Test AI declaration generation
5. Verify admin dashboard access

## Support

For issues or questions:
1. Check the error logs in Vercel
2. Review Supabase dashboard for data integrity
3. Check browser console for client-side errors
4. Review API responses in Network tab

---

**Built with:** Next.js, TypeScript, Supabase, Tailwind CSS, Vercel AI SDK
