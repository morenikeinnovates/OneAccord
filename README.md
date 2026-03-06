# OneAccord - Guided Conversations for Couples

OneAccord is a faith-based platform that helps couples at any stage (dating, engaged, married) build deeper connection through guided conversations on 10 core life topics.

## Key Features

### For Couples
- **Magic Link Authentication** - No passwords, just email-based sign-in
- **Partner Linking** - Connect with your partner using a simple code
- **10 Guided Categories**
  - Foundation - Building solid ground
  - Faith - Spiritual alignment
  - Communication - Speaking and listening
  - Conflict - Handling disagreements
  - Money - Financial planning
  - Career - Work and ambitions
  - Intimacy - Physical and emotional connection
  - Family - Relationships with extended family
  - Kids - Parenting desires and plans
  - Legacy - Long-term vision

- **Two Conversation Modes**
  - **Deep Dive** - Full conversations with detailed questions (30+ min per session)
  - **Flash Cards** - Quick yes/no questions (10-15 min per session)

- **Three-Step Session Flow**
  1. **My Story** - Share your perspective on a topic
  2. **Your Story** - Read your partner's perspective
  3. **Find Our Middle** - Identify common ground and alignment

- **AI-Powered Declarations** - Generate sealed couple declarations based on session responses
  - Claude AI creates draft declarations
  - Both partners review and approve
  - Sealed as digital keepsakes

- **Progress Tracking** - View completion history across all categories

### For Admins
- **User Management** - View all users and their profile information
- **Couple Tracking** - Monitor couple connections and session activity
- **Analytics Dashboard** - See completion rates, popular topics, engagement metrics
- **Session Reports** - Detailed view of session completion and responses
- **Declaration History** - Track all sealed declarations

## Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe code
- **Tailwind CSS** - Utility-first styling
- **Client & Server Components** - Optimized rendering

### Backend
- **Next.js API Routes** - Serverless functions
- **Supabase PostgreSQL** - Managed database
- **Row Level Security (RLS)** - Data protection policies

### Authentication
- **Supabase Auth** - Magic link email authentication

### AI
- **Vercel AI SDK 6** - AI model integration
- **Claude** - Declaration generation

## Project Structure

```
oneaccord/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Landing page
│   ├── session/page.tsx        # Session UI
│   ├── declarations/page.tsx   # Declaration review
│   ├── admin/page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── auth/callback/      # Auth callbacks
│   │   ├── sessions/           # Session CRUD
│   │   ├── responses/          # Response storage
│   │   ├── couples/            # Couple linking
│   │   ├── declarations/       # Declarations & AI generation
│   │   └── admin/              # Admin operations
│   ├── globals.css             # Global styles
│   └── auth/
├── components/
│   ├── SignIn.tsx              # Auth component
│   ├── Dashboard.tsx           # Main user dashboard
│   └── CoupleLink.tsx          # Couple linking UI
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── types.ts                # TypeScript types
│   ├── sessions-data.ts        # Categories and questions
│   ├── db-utils.ts             # Database helpers
│   └── admin.ts                # Admin utilities
├── scripts/
│   └── supabase-schema.sql     # Database setup
├── middleware.ts               # Route protection
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── SETUP.md                    # Setup instructions
```

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- Vercel account (for deployment)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd oneaccord
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   Add your Supabase credentials to `.env.local`

4. **Set up the database**
   - Go to your Supabase project
   - Open SQL Editor
   - Copy contents of `scripts/supabase-schema.sql`
   - Execute in SQL Editor

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   - Visit `http://localhost:3000`

### Deployment to Vercel

1. **Connect your GitHub repository**
   - Push code to main branch

2. **Add environment variables in Vercel**
   - Project Settings > Environment Variables
   - Add: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

3. **Deploy**
   - Vercel automatically deploys on push to main

## Database Schema

### Tables

**profiles**
- Extends Supabase auth.users
- Stores relationship stage, couple_id
- One-to-one with auth users

**couples**
- Links two profiles
- Tracks status (pending/active/completed)
- Stores coupling code for joining

**sessions**
- Created per user per category
- Tracks conversation progress
- Stores mode (deep/flashcard) and status

**responses**
- User answers per session step
- Stores JSON of responses
- Tracks which step (mystory/yourstory/middle)

**declarations**
- Couple declarations from sessions
- Stores draft and final text
- Tracks approval status from both users
- Records sealed_at timestamp

**session_attempts**
- Historical record of completed sessions
- Links to declarations

### Row Level Security

- **Profiles**: Users see own + partner's (if linked)
- **Couples**: Users see couples they're in
- **Sessions**: Users see own sessions
- **Responses**: Users see own responses + partner's in shared sessions
- **Declarations**: Couple members can view/update
- **Session Attempts**: Couple members can view history

## API Documentation

### Authentication
- `GET /auth/callback` - Handle Supabase callback

### Sessions
- `GET /api/sessions` - Get user's sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details

### Responses
- `POST /api/responses` - Save response
- `GET /api/responses?sessionId=X` - Get session responses

### Couples
- `POST /api/couples/generate-code` - Generate code (user creates)
- `POST /api/couples/join` - Join with code (partner joins)
- `GET /api/couples/:id` - Get couple details

### Declarations
- `POST /api/declarations/generate` - Generate AI declaration (streaming)
- `GET /api/declarations` - Get user's declarations
- `POST /api/declarations/:id/approve` - Approve declaration
- `POST /api/declarations/:id/seal` - Seal declaration

### Admin
- `GET /api/admin/users` - List all users
- `GET /api/admin/couples` - List all couples
- `GET /api/admin/sessions` - List all sessions

## Usage Flow

### First Time User
1. Visit OneAccord and sign in with email
2. Receive magic link in email
3. Click link to authenticate
4. Profile auto-created with relationship stage selection
5. Redirected to dashboard

### Couple Linking
1. User A generates coupling code in dashboard
2. Share code with User B
3. User B enters code in "Link with Partner" section
4. System creates couple connection
5. Both users now see shared couple space

### Running a Session
1. From dashboard, select category and session
2. Choose Deep Dive or Flash Cards mode
3. Answer questions in "My Story" step
4. Read partner's "Your Story" (if linked)
5. Find alignment in "Find Our Middle" step
6. Save and move to next session

### Creating a Declaration
1. After completing session steps
2. Click "Generate Declaration"
3. AI creates draft based on responses
4. Both partners review and edit
5. Both approve to seal
6. Sealed declaration saved as keepsake

## Configuration

### Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (optional, defaults to Vercel AI Gateway)
# AI_GATEWAY_API_KEY=your-key (if using non-default provider)
```

### Customization

#### Adding More Categories
Edit `lib/sessions-data.ts`:
```typescript
const CATEGORIES: SessionCategory[] = [
  {
    key: 'your-key',
    name: 'Category Name',
    emoji: '📚',
    desc: 'Description',
    sessions: [
      // Add SessionItem objects
    ]
  }
]
```

#### Changing Theme Colors
Edit `tailwind.config.js` and `app/globals.css` to customize the color scheme.

## Troubleshooting

### Auth Issues
- **"No session found"** - Clear cookies and sign in again
- **"Magic link expired"** - Request new link (valid for 24 hours)
- **"Profile not found"** - Check database connection

### Database Issues
- **"RLS policy violation"** - Ensure user is properly authenticated
- **"Table not found"** - Run schema setup in Supabase SQL Editor
- **Connection timeouts** - Check Supabase network settings

### AI Issues
- **"Declaration not generating"** - Verify API keys are set
- **"Timeout during generation"** - May take 30+ seconds for long responses

### Performance
- Enable database indexes (included in schema)
- Use Next.js Image Optimization for media
- Cache session data with SWR on client

## Support & Contribution

For issues, questions, or contributions:
1. Check SETUP.md for setup instructions
2. Review error logs in Vercel dashboard
3. Check Supabase dashboard for data issues

## License

© 2024 OneAccord. All rights reserved.

## Roadmap

Future enhancements:
- Mobile native apps (iOS/Android)
- Video integration for long-distance couples
- Couple calendar for scheduling sessions
- Integration with faith-based resources
- Couple coaching marketplace
- Advanced analytics and insights
- PDF export of declarations
- Multi-language support

---

**Built with love for couples everywhere.**
