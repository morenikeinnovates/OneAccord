export type RelationshipStage = 'dating' | 'engaged' | 'married';
export type SessionMode = 'deep' | 'flashcard';
export type ResponseStep = 'mystory' | 'yourstory' | 'middle';
export type SessionStatus = 'in-progress' | 'completed' | 'paused';
export type CoupleStatus = 'pending' | 'active' | 'completed';

export interface Profile {
  id: string;
  email: string;
  relationship_stage: RelationshipStage;
  couple_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Couple {
  id: string;
  user1_id: string;
  user2_id: string;
  coupling_code: string;
  status: CoupleStatus;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  couple_id: string | null;
  category_key: string;
  session_number: number;
  mode: SessionMode;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
}

export interface Response {
  id: string;
  session_id: string;
  user_id: string;
  step: ResponseStep;
  responses_json: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export interface Declaration {
  id: string;
  session_id: string;
  couple_id: string;
  draft_text: string | null;
  final_text: string | null;
  ai_generated: boolean;
  user1_approved: boolean;
  user2_approved: boolean;
  sealed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SessionAttempt {
  id: string;
  declaration_id: string;
  completed_at: string;
}
