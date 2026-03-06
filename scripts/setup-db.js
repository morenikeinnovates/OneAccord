import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const schema = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  relationship_stage TEXT CHECK (relationship_stage IN ('dating', 'engaged', 'married')),
  couple_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Couples Table
CREATE TABLE IF NOT EXISTS couples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  coupling_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES couples(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL,
  session_number INT DEFAULT 1,
  mode TEXT CHECK (mode IN ('deep', 'flashcard')),
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Responses Table
CREATE TABLE IF NOT EXISTS responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('mystory', 'yourstory', 'middle')),
  responses_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Declarations Table
CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  draft_text TEXT,
  final_text TEXT,
  ai_generated BOOLEAN DEFAULT FALSE,
  user1_approved BOOLEAN DEFAULT FALSE,
  user2_approved BOOLEAN DEFAULT FALSE,
  sealed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Session Attempts Table
CREATE TABLE IF NOT EXISTS session_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  declaration_id UUID NOT NULL REFERENCES declarations(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_couples_coupling_code ON couples(coupling_code);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_couple_id ON sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_sessions_category_status ON sessions(category_key, status);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON responses(user_id);
CREATE INDEX IF NOT EXISTS idx_declarations_couple_id ON declarations(couple_id);
CREATE INDEX IF NOT EXISTS idx_declarations_session_id ON declarations(session_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view their couples" ON couples FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY "Users can update their couples" ON couples FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid()) WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can create sessions" ON sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own responses" ON responses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert responses" ON responses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own responses" ON responses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Couple members can view declarations" ON declarations FOR SELECT USING (
  EXISTS (SELECT 1 FROM couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
);
CREATE POLICY "Couple members can update their declarations" ON declarations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
);

CREATE POLICY "Users can view attempt history" ON session_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM declarations WHERE declarations.id = session_attempts.declaration_id AND EXISTS (SELECT 1 FROM couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())))
);
`;

async function setupDatabase() {
  try {
    console.log('Starting database setup...');
    const { error } = await supabase.rpc('execute_sql', { query: schema });
    
    if (error) {
      console.error('Error setting up database:', error);
      process.exit(1);
    }
    
    console.log('Database setup completed successfully!');
  } catch (err) {
    console.error('Setup error:', err);
    process.exit(1);
  }
}

setupDatabase();
