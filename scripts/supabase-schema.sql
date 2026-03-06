-- OneAccord Supabase Database Schema
-- Execute this in Supabase SQL Editor - Breaking into parts for reliability

-- PART 1: Create Tables
-- =====================

-- 1. Profiles Table (extends Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  relationship_stage TEXT CHECK (relationship_stage IN ('dating', 'engaged', 'married')),
  couple_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Couples Table (links two users)
CREATE TABLE IF NOT EXISTS public.couples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  coupling_code TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT different_users CHECK (user1_id != user2_id)
);

-- 3. Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  couple_id UUID REFERENCES public.couples(id) ON DELETE CASCADE,
  category_key TEXT NOT NULL,
  session_number INT DEFAULT 1,
  mode TEXT CHECK (mode IN ('deep', 'flashcard')),
  status TEXT DEFAULT 'in-progress' CHECK (status IN ('in-progress', 'completed', 'paused')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Responses Table
CREATE TABLE IF NOT EXISTS public.responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step TEXT NOT NULL CHECK (step IN ('mystory', 'yourstory', 'middle')),
  responses_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Declarations Table
CREATE TABLE IF NOT EXISTS public.declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  couple_id UUID NOT NULL REFERENCES public.couples(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS public.session_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  declaration_id UUID NOT NULL REFERENCES public.declarations(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- PART 2: Create Indexes
-- ======================

CREATE INDEX IF NOT EXISTS idx_profiles_couple_id ON public.profiles(couple_id);
CREATE INDEX IF NOT EXISTS idx_couples_user1_id ON public.couples(user1_id);
CREATE INDEX IF NOT EXISTS idx_couples_user2_id ON public.couples(user2_id);
CREATE INDEX IF NOT EXISTS idx_couples_coupling_code ON public.couples(coupling_code);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_couple_id ON public.sessions(couple_id);
CREATE INDEX IF NOT EXISTS idx_sessions_category_status ON public.sessions(category_key, status);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON public.responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_user_id ON public.responses(user_id);
CREATE INDEX IF NOT EXISTS idx_declarations_couple_id ON public.declarations(couple_id);
CREATE INDEX IF NOT EXISTS idx_declarations_session_id ON public.declarations(session_id);

-- PART 3: Enable Row Level Security
-- ==================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couples ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_attempts ENABLE ROW LEVEL SECURITY;

-- PART 4: RLS Policies
-- ====================

-- Profiles policies
CREATE POLICY IF NOT EXISTS "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Couples policies
CREATE POLICY IF NOT EXISTS "Users can view their couples" ON public.couples FOR SELECT USING (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can create couples" ON public.couples FOR INSERT WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update their couples" ON public.couples FOR UPDATE USING (user1_id = auth.uid() OR user2_id = auth.uid()) WITH CHECK (user1_id = auth.uid() OR user2_id = auth.uid());

-- Sessions policies
CREATE POLICY IF NOT EXISTS "Users can view own sessions" ON public.sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can create sessions" ON public.sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update own sessions" ON public.sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Responses policies
CREATE POLICY IF NOT EXISTS "Users can view own responses" ON public.responses FOR SELECT USING (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can insert responses" ON public.responses FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY IF NOT EXISTS "Users can update own responses" ON public.responses FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Declarations policies
CREATE POLICY IF NOT EXISTS "Couple members can view declarations" ON public.declarations FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
);
CREATE POLICY IF NOT EXISTS "Couple members can update declarations" ON public.declarations FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
);
CREATE POLICY IF NOT EXISTS "Couple members can create declarations" ON public.declarations FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid()))
);

-- Session attempts policies
CREATE POLICY IF NOT EXISTS "Users can view attempt history" ON public.session_attempts FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.declarations WHERE declarations.id = session_attempts.declaration_id AND EXISTS (SELECT 1 FROM public.couples WHERE couples.id = declarations.couple_id AND (couples.user1_id = auth.uid() OR couples.user2_id = auth.uid())))
);
