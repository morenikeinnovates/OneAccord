-- OneAccord Supabase Database Schema
-- Handles user profiles, couple linking, sessions, responses, and declarations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (extends Supabase Auth users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  relationship_stage TEXT CHECK (relationship_stage IN ('dating', 'engaged', 'married')),
  couple_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Couples Table (links two users)
CREATE TABLE couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupling_code TEXT UNIQUE, -- code for user 2 to join
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- 3. Sessions Table (tracks progress through each category)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL, -- e.g., 'foundation', 'faith', 'communication'
  session_number INT DEFAULT 1, -- which session in that category
  mode TEXT CHECK (mode IN ('deep', 'flashcard')), -- deep or flashcard mode
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Responses Table (stores user answers)
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('mystory', 'yourstory', 'middle')), -- which step they're on
  responses_json JSONB, -- flexible storage for answers {q1: "answer", q2: "answer"}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Declarations Table (final couple declarations)
CREATE TABLE declarations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  draft_text TEXT, -- AI-generated draft
  final_text TEXT, -- approved final version
  ai_generated BOOLEAN DEFAULT FALSE,
  user1_approved BOOLEAN DEFAULT FALSE,
  user2_approved BOOLEAN DEFAULT FALSE,
  sealed_at TIMESTAMP WITH TIME ZONE, -- when both approved
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Session Attempts Table (historical tracking)
CREATE TABLE session_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX idx_couples_user1_id ON couples(user1_id);
CREATE INDEX idx_couples_user2_id ON couples(user2_id);
CREATE INDEX idx_couples_coupling_code ON couples(coupling_code);
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_couple_id ON sessions(couple_id);
CREATE INDEX idx_sessions_category_status ON sessions(category_key, status);
CREATE INDEX idx_responses_session_id ON responses(session_id);
CREATE INDEX idx_responses_user_id ON responses(user_id);
CREATE INDEX idx_declarations_couple_id ON declarations(couple_id);
CREATE INDEX idx_declarations_session_id ON declarations(session_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Profiles
-- Users can view their own profile and their couple partner's profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can view partner profile"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE (couples.user1_id = auth.uid() AND couples.user2_id = profiles.id)
         OR (couples.user2_id = auth.uid() AND couples.user1_id = profiles.id)
    )
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- RLS Policies for Couples
-- Users can view couples they're part of
CREATE POLICY "Users can view their couples"
  ON couples FOR SELECT
  USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can update their couples"
  ON couples FOR UPDATE
  USING (user1_id = auth.uid() OR user2_id = auth.uid())
  WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- RLS Policies for Sessions
-- Users can view/edit their own sessions and couple sessions
CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view couple sessions"
  ON sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = sessions.couple_id
        AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Users can create sessions"
  ON sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Responses
-- Users can view responses from their couple partner (for transparency)
-- Users can only insert/update their own responses
CREATE POLICY "Users can view own responses"
  ON responses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can view partner responses in shared sessions"
  ON responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = responses.session_id
        AND sessions.couple_id IS NOT NULL
        AND EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = sessions.couple_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    )
  );

CREATE POLICY "Users can insert responses"
  ON responses FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own responses"
  ON responses FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for Declarations
-- Couple members can view and update declarations for their sessions
CREATE POLICY "Couple members can view declarations"
  ON declarations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = declarations.couple_id
        AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

CREATE POLICY "Couple members can update their declarations"
  ON declarations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = declarations.couple_id
        AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM couples
      WHERE couples.id = declarations.couple_id
        AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
    )
  );

-- RLS Policies for Session Attempts
-- Users can view attempts for their declarations
CREATE POLICY "Users can view attempt history"
  ON session_attempts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM declarations
      WHERE declarations.id = session_attempts.declaration_id
        AND EXISTS (
          SELECT 1 FROM couples
          WHERE couples.id = declarations.couple_id
            AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())
        )
    )
  );

-- Admin policies (for admin dashboard)
-- Create admin role if it doesn't exist and grant permissions
-- Note: Run these separately with admin key after creating admin users
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO admin_role;
