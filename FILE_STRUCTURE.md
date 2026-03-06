# OneAccord File Structure

Complete guide to the OneAccord project structure.

## Directory Tree

```
oneaccord/
│
├── 📱 User Interface (App Pages)
│   ├── app/
│   │   ├── page.tsx                    # Landing page with auth
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Dashboard page redirect
│   │   ├── session/
│   │   │   └── page.tsx                # Session UI (240+ lines)
│   │   ├── declarations/
│   │   │   └── page.tsx                # Declaration review (350+ lines)
│   │   ├── admin/
│   │   │   └── page.tsx                # Admin dashboard (320+ lines)
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts            # OAuth callback
│   │
│   └── components/ (Reusable UI)
│       ├── SignIn.tsx                  # Auth component (85 lines)
│       ├── Dashboard.tsx               # Main dashboard (130 lines)
│       └── CoupleLink.tsx              # Couple linking (210 lines)
│
├── 🔌 API Routes (Backend)
│   └── app/api/
│       ├── auth/
│       │   ├── signin/route.ts         # Magic link request
│       │   └── signout/route.ts        # Sign out
│       ├── sessions/
│       │   └── route.ts                # Session CRUD (70 lines)
│       ├── responses/
│       │   └── route.ts                # Save/get responses (95 lines)
│       ├── couples/
│       │   └── route.ts                # Couple linking (145 lines)
│       ├── declarations/
│       │   ├── route.ts                # Declarations CRUD (100 lines)
│       │   └── generate/
│       │       └── route.ts            # AI generation (115 lines)
│       └── admin/
│           ├── users/
│           │   └── route.ts            # User management (90 lines)
│           └── couples/
│               └── route.ts            # Couple analytics (70 lines)
│
├── 📚 Libraries & Utilities
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase client (16 lines)
│   │   ├── types.ts                    # TypeScript types (68 lines)
│   │   ├── sessions-data.ts            # Categories & questions (110 lines)
│   │   ├── db-utils.ts                 # Database helpers (380 lines)
│   │   └── admin.ts                    # Admin helpers (35 lines)
│   │
│   └── middleware.ts                   # Route protection (62 lines)
│
├── 🗄️ Database
│   └── scripts/
│       ├── supabase-schema.sql         # Database setup (160 lines)
│       └── setup-database.js           # Setup helper (165 lines)
│
├── ⚙️ Configuration Files
│   ├── package.json                    # Dependencies & scripts
│   ├── tsconfig.json                   # TypeScript config (30 lines)
│   ├── next.config.js                  # Next.js config (7 lines)
│   ├── tailwind.config.js              # Tailwind config (12 lines)
│   ├── postcss.config.js               # PostCSS config (7 lines)
│   ├── .env.example                    # Environment template
│   └── .gitignore                      # Git ignore rules
│
├── 📖 Documentation
│   ├── README.md                       # Complete guide (343 lines)
│   ├── SETUP.md                        # Setup instructions (273 lines)
│   ├── QUICKSTART.md                   # Quick start (279 lines)
│   ├── DEPLOYMENT.md                   # Deployment guide (348 lines)
│   ├── API_REFERENCE.md                # API docs (502 lines)
│   ├── PROJECT_SUMMARY.md              # Technical summary (423 lines)
│   ├── LAUNCH_CHECKLIST.md             # Pre-launch checklist (398 lines)
│   ├── COMPLETION_SUMMARY.md           # Build completion (448 lines)
│   └── FILE_STRUCTURE.md               # This file
│
└── 📦 Project Files
    ├── .next/                          # Next.js build output (ignored)
    ├── node_modules/                   # Dependencies (ignored)
    ├── .vercel/                        # Vercel config (ignored)
    ├── .git/                           # Git history (ignored)
    └── .env.local                      # Environment variables (ignored)
```

---

## File Descriptions

### App Pages

#### `app/page.tsx` (130+ lines)
- **Purpose:** Landing page and sign-in
- **Features:** Feature overview, auth form, responsive design
- **Routes to:** `/dashboard` after auth
- **Key Components:** SignIn component

#### `app/dashboard/page.tsx` (40 lines)
- **Purpose:** Dashboard redirect and loader
- **Features:** Auth check, redirect to main dashboard
- **Routes to:** Home page if not authenticated
- **Key Components:** Dashboard component

#### `app/session/page.tsx` (210 lines)
- **Purpose:** Guided conversation interface
- **Features:** Three-step workflow, response saving, question display
- **Query Params:** `category`, `sessionId`, `mode`
- **Key Functions:** handleResponseChange, handleSaveAndNext, loadExistingResponses

#### `app/declarations/page.tsx` (348 lines)
- **Purpose:** Declaration review and approval
- **Features:** AI draft view, editing, approval workflow, sealing
- **Key Functions:** generateDeclaration, approveDeclaration, sealDeclaration
- **Streaming:** Handles AI response streaming

#### `app/admin/page.tsx` (322 lines)
- **Purpose:** Admin dashboard for platform management
- **Features:** User list, couple tracking, analytics, session reports
- **Key Functions:** fetchUsers, fetchCouples, fetchAnalytics
- **Admin Only:** Protected by admin role check

#### `app/layout.tsx` (20 lines)
- **Purpose:** Root layout wrapper
- **Features:** Fonts, metadata, globals CSS
- **Includes:** Global styles, TypeScript types

#### `app/globals.css` (23 lines)
- **Purpose:** Global styling
- **Features:** CSS variables, base styles, tailwind imports

---

### Components

#### `components/SignIn.tsx` (85 lines)
- **Purpose:** Authentication form
- **Features:** Email input, magic link request, loading states
- **Key Functions:** handleSignIn, handleResendLink
- **Error Handling:** Shows user-friendly error messages

#### `components/Dashboard.tsx` (140 lines)
- **Purpose:** Main user interface
- **Features:** Tabbed interface (Sessions, Couple, Progress), category list
- **Tabs:** Categories, Link with Partner, Progress
- **Key Functions:** startSession, handleSignOut
- **Imports:** CoupleLink component

#### `components/CoupleLink.tsx` (208 lines)
- **Purpose:** Couple linking UI
- **Features:** Generate code, enter code to join, display coupling code
- **Key Functions:** generateCode, joinCouple, copyToClipboard
- **State Management:** Loading states, error handling

---

### API Routes

#### `app/api/auth/callback/route.ts` (23 lines)
- **Purpose:** Supabase OAuth callback
- **Method:** GET
- **Handles:** Auth code exchange, session creation
- **Redirects:** To `/dashboard` after success

#### `app/api/sessions/route.ts` (71 lines)
- **Purpose:** Session CRUD operations
- **Methods:** GET (list), POST (create)
- **Database:** Queries/inserts sessions table
- **Returns:** Session list or new session object

#### `app/api/responses/route.ts` (94 lines)
- **Purpose:** Response storage and retrieval
- **Methods:** GET (retrieve), POST (save)
- **Database:** Queries/inserts responses table
- **Logic:** Updates existing or creates new response

#### `app/api/couples/route.ts` (143 lines)
- **Purpose:** Couple management
- **Endpoints:** Generate code, join couple
- **Database:** Couples table, profiles updates
- **Logic:** Code generation, validation, status updates

#### `app/api/declarations/route.ts` (99 lines)
- **Purpose:** Declaration CRUD
- **Methods:** GET (list/get), POST (create), PUT (edit), POST (approve/seal)
- **Database:** Declarations table
- **Logic:** Approval tracking, sealing process

#### `app/api/declarations/generate/route.ts` (115 lines)
- **Purpose:** AI declaration generation
- **Method:** POST (streaming)
- **AI:** Claude via Vercel AI SDK
- **Response:** Server-sent events stream
- **Logic:** Collects responses, generates declaration

#### `app/api/admin/users/route.ts` (89 lines)
- **Purpose:** Admin user management
- **Method:** GET (list)
- **Database:** Profiles table
- **Admin Only:** Service role key required
- **Returns:** User list with pagination

#### `app/api/admin/couples/route.ts` (67 lines)
- **Purpose:** Admin couple analytics
- **Method:** GET (list)
- **Database:** Couples table with stats
- **Admin Only:** Service role key required
- **Returns:** Couple list with metrics

---

### Libraries

#### `lib/supabase.ts` (16 lines)
- **Purpose:** Supabase client initialization
- **Exports:** `supabase` client instance
- **Configuration:** From environment variables
- **Use:** Imported in all server/client code

#### `lib/types.ts` (68 lines)
- **Purpose:** TypeScript type definitions
- **Types:** 
  - SessionCategory, SessionItem
  - User, Profile, Couple, Session, Response
  - Declaration, DeclarationResponse
- **Import:** Used throughout codebase

#### `lib/sessions-data.ts` (111 lines)
- **Purpose:** Question and category data
- **Data:** 10 categories with sessions and questions
- **Categories:** Foundation, Faith, Communication, Conflict, Money, Career, Intimacy, Family, Kids, Legacy
- **Questions:** 3 per step (mystory, yourstory, middle)

#### `lib/db-utils.ts` (383 lines)
- **Purpose:** Database helper functions
- **Functions:** 20+ CRUD and utility functions
- **Key Functions:**
  - ensureUserProfile
  - createSession, completeSession
  - saveResponse, getSessionResponses
  - createCouple, joinCouple, getUserCouple
  - createDeclaration, approveDeclaration, sealDeclaration
  - Plus history and utility functions

#### `lib/admin.ts` (35 lines)
- **Purpose:** Admin helper functions
- **Functions:** checkAdminRole, requireAdmin, getAdminStats
- **Import:** Used in admin API routes

---

### Configuration

#### `package.json`
- **Name:** oneaccord
- **Version:** 0.1.0
- **Scripts:** dev, build, start, lint
- **Dependencies:** 
  - React 18.3.1
  - Next.js 15
  - @supabase/supabase-js 2.38.0
  - Tailwind CSS 3.4.0
  - ai 6.0.0
  - @ai-sdk/react 3.0.0
- **DevDependencies:** TypeScript, @types/*, Next.js types

#### `tsconfig.json` (30 lines)
- **Target:** ES2020
- **Module:** ESNext
- **JSX:** Preserve
- **Paths:** Configured @ alias
- **Strict Mode:** Enabled
- **Include:** app, lib, components

#### `next.config.js` (7 lines)
- **Compiler:** SWC
- **Images:** Optimized
- **Optimization:** Enabled

#### `tailwind.config.js` (12 lines)
- **Content:** app/**, components/**, lib/**
- **Theme:** Extended with custom colors
- **Plugins:** None required

#### `postcss.config.js` (7 lines)
- **Plugins:** Tailwind, autoprefixer

#### `.env.example` (4 lines)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

### Database

#### `scripts/supabase-schema.sql` (160 lines)
- **Purpose:** Database initialization
- **Creates:** 6 tables (profiles, couples, sessions, responses, declarations, session_attempts)
- **Adds:** Indexes, RLS policies, constraints
- **Execute In:** Supabase SQL Editor

#### `scripts/setup-database.js` (165 lines)
- **Purpose:** Alternative setup script
- **Method:** Node.js with Supabase client
- **Usage:** `npm run setup-db`

---

### Documentation Files

| File | Lines | Purpose |
|------|-------|---------|
| README.md | 343 | Complete feature guide |
| SETUP.md | 273 | Step-by-step setup |
| QUICKSTART.md | 279 | 5-minute quick start |
| DEPLOYMENT.md | 348 | Vercel deployment |
| API_REFERENCE.md | 502 | Complete API docs |
| PROJECT_SUMMARY.md | 423 | Technical overview |
| LAUNCH_CHECKLIST.md | 398 | Pre-launch checklist |
| COMPLETION_SUMMARY.md | 448 | Build summary |
| FILE_STRUCTURE.md | This | Directory guide |

---

## File Size Summary

```
Components:           ~425 lines
Pages:                ~1,050 lines
API Routes:           ~650 lines
Libraries:            ~610 lines
Configuration:        ~85 lines
Database Scripts:     ~325 lines
Documentation:        ~2,700 lines
────────────────────────────
TOTAL:                ~5,845 lines
```

---

## Key Relationships

### Import Chain Example
```
app/page.tsx
├── components/SignIn.tsx
│   └── lib/supabase.ts
├── components/Dashboard.tsx
│   ├── components/CoupleLink.tsx
│   │   └── lib/db-utils.ts
│   └── lib/sessions-data.ts
└── lib/supabase.ts
```

### API Call Flow
```
components/SignIn.tsx
├── POST /api/auth/signin
│   └── Supabase auth
app/session/page.tsx
├── POST /api/sessions
├── POST /api/responses
├── GET /api/responses
└── lib/db-utils.ts
app/declarations/page.tsx
├── POST /api/declarations/generate (streaming)
├── POST /api/declarations/:id/approve
└── POST /api/declarations/:id/seal
```

---

## File Modification Frequency

### Most Changed During Development
1. `lib/db-utils.ts` - Database operations
2. `app/session/page.tsx` - Session UI
3. `app/declarations/page.tsx` - Declarations
4. `components/Dashboard.tsx` - Main UI
5. `lib/sessions-data.ts` - Questions

### Stable Configuration Files
- `tsconfig.json`
- `tailwind.config.js`
- `next.config.js`
- `postcss.config.js`

---

## Adding New Features

### To Add New API Endpoint
1. Create file in `app/api/[feature]/route.ts`
2. Export async function (GET, POST, etc.)
3. Import `supabase` from `lib/supabase`
4. Add types to `lib/types.ts`
5. Document in API_REFERENCE.md

### To Add New Page
1. Create folder in `app/[pagename]/`
2. Create `page.tsx` inside
3. Export default React component
4. Route available at `/[pagename]`
5. Add to documentation

### To Add New Component
1. Create file in `components/[ComponentName].tsx`
2. Export default React component
3. Import in pages where needed
4. Pass props as needed

### To Add New Category
1. Edit `lib/sessions-data.ts`
2. Add to CATEGORIES array
3. Include 3 sessions per category
4. Include questions for each step
5. New category available in dashboard

---

## Environment Variables

### Required (All Three)
```
NEXT_PUBLIC_SUPABASE_URL=              # Public
NEXT_PUBLIC_SUPABASE_ANON_KEY=         # Public
SUPABASE_SERVICE_ROLE_KEY=             # Secret
```

### Optional
```
# AI Gateway (if using non-default provider)
AI_GATEWAY_API_KEY=                    # For custom AI providers
```

### Development vs Production
- **.env.local** - Local development (ignored by git)
- **Vercel Secrets** - Production environment variables
- **Never commit** - .env files to git

---

## Quick Reference

### Running Commands
```bash
npm install              # Install dependencies
npm run dev             # Start dev server (localhost:3000)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run linter
```

### Database Operations
```bash
# Execute schema in Supabase SQL Editor
# Copy scripts/supabase-schema.sql
# Paste in Supabase > SQL Editor > Run
```

### Deployment
```bash
git push origin main    # Push to GitHub
# Vercel auto-deploys   # Automatic deployment
```

---

## Notes for Developers

### Code Style
- Use TypeScript for type safety
- Follow Next.js best practices
- Use Tailwind classes for styling
- Keep components small and reusable
- Put business logic in lib/db-utils.ts

### Testing
- Test locally with `npm run dev`
- Test each API endpoint before deploy
- Test with real Supabase instance
- Check mobile responsive design
- Verify error handling

### Performance
- Use Next.js Image component
- Implement SWR for caching
- Optimize database queries
- Use proper indexes
- Monitor Vercel analytics

### Security
- Keep API keys in environment variables
- Use RLS policies for database
- Validate all inputs
- Use parameterized queries
- Check authorization on admin routes

---

**Happy coding! 🚀**

For more details, see README.md or PROJECT_SUMMARY.md
