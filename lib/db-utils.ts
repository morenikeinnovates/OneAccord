import { supabase } from './supabase';

/**
 * Create or get user profile
 */
export async function ensureUserProfile(userId: string, email: string, relationshipStage?: string) {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // Profile doesn't exist, create it
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email,
          relationship_stage: relationshipStage || 'dating',
        })
        .select()
        .single();

      if (createError) throw createError;
      return newProfile;
    }

    if (error) throw error;
    return profile;
  } catch (err) {
    console.error('[v0] Error ensuring user profile:', err);
    throw err;
  }
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  categoryKey: string,
  coupleId?: string,
  mode: 'deep' | 'flashcard' = 'deep'
) {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        category_key: categoryKey,
        couple_id: coupleId,
        mode,
        status: 'in-progress',
      })
      .select()
      .single();

    if (error) throw error;
    return session;
  } catch (err) {
    console.error('[v0] Error creating session:', err);
    throw err;
  }
}

/**
 * Save response to a session
 */
export async function saveResponse(
  sessionId: string,
  userId: string,
  step: 'mystory' | 'yourstory' | 'middle',
  responsesJson: Record<string, string>
) {
  try {
    // Check if response already exists for this step
    const { data: existing } = await supabase
      .from('responses')
      .select('id')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .eq('step', step)
      .single();

    if (existing) {
      // Update existing
      const { data: updated, error } = await supabase
        .from('responses')
        .update({ responses_json: responsesJson })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return updated;
    } else {
      // Create new
      const { data: created, error } = await supabase
        .from('responses')
        .insert({
          session_id: sessionId,
          user_id: userId,
          step,
          responses_json: responsesJson,
        })
        .select()
        .single();

      if (error) throw error;
      return created;
    }
  } catch (err) {
    console.error('[v0] Error saving response:', err);
    throw err;
  }
}

/**
 * Get all responses for a session
 */
export async function getSessionResponses(sessionId: string) {
  try {
    const { data: responses, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;
    return responses || [];
  } catch (err) {
    console.error('[v0] Error fetching session responses:', err);
    throw err;
  }
}

/**
 * Create a couple and generate coupling code
 */
export async function createCouple(userId: string) {
  try {
    const couplingCode = generateCouplingCode();

    const { data: couple, error } = await supabase
      .from('couples')
      .insert({
        user1_id: userId,
        coupling_code: couplingCode,
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;
    return couple;
  } catch (err) {
    console.error('[v0] Error creating couple:', err);
    throw err;
  }
}

/**
 * Join a couple with coupling code
 */
export async function joinCouple(userId: string, couplingCode: string) {
  try {
    // Find the couple with this code
    const { data: couple, error: findError } = await supabase
      .from('couples')
      .select('*')
      .eq('coupling_code', couplingCode)
      .single();

    if (findError) throw new Error('Invalid coupling code');
    if (couple.user2_id) throw new Error('Coupling code already used');

    // Update couple to add second user and activate
    const { data: updated, error: updateError } = await supabase
      .from('couples')
      .update({
        user2_id: userId,
        status: 'active',
      })
      .eq('id', couple.id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update profiles to link to couple
    await supabase.from('profiles').update({ couple_id: couple.id }).eq('id', userId);
    await supabase.from('profiles').update({ couple_id: couple.id }).eq('id', couple.user1_id);

    return updated;
  } catch (err) {
    console.error('[v0] Error joining couple:', err);
    throw err;
  }
}

/**
 * Get user's couple if exists
 */
export async function getUserCouple(userId: string) {
  try {
    const { data: couple, error } = await supabase
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .single();

    if (error && error.code === 'PGRST116') {
      return null; // No couple found
    }

    if (error) throw error;
    return couple;
  } catch (err) {
    console.error('[v0] Error fetching user couple:', err);
    throw err;
  }
}

/**
 * Complete a session
 */
export async function completeSession(sessionId: string) {
  try {
    const { data: session, error } = await supabase
      .from('sessions')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', sessionId)
      .select()
      .single();

    if (error) throw error;
    return session;
  } catch (err) {
    console.error('[v0] Error completing session:', err);
    throw err;
  }
}

/**
 * Create a declaration draft
 */
export async function createDeclaration(
  sessionId: string,
  coupleId: string,
  draftText: string,
  aiGenerated: boolean = false
) {
  try {
    const { data: declaration, error } = await supabase
      .from('declarations')
      .insert({
        session_id: sessionId,
        couple_id: coupleId,
        draft_text: draftText,
        ai_generated: aiGenerated,
      })
      .select()
      .single();

    if (error) throw error;
    return declaration;
  } catch (err) {
    console.error('[v0] Error creating declaration:', err);
    throw err;
  }
}

/**
 * Approve declaration for a user
 */
export async function approveDeclaration(declarationId: string, isUser1: boolean) {
  try {
    const updateData = isUser1
      ? { user1_approved: true }
      : { user2_approved: true };

    const { data: declaration, error } = await supabase
      .from('declarations')
      .update(updateData)
      .eq('id', declarationId)
      .select()
      .single();

    if (error) throw error;
    return declaration;
  } catch (err) {
    console.error('[v0] Error approving declaration:', err);
    throw err;
  }
}

/**
 * Seal a declaration (both users approved)
 */
export async function sealDeclaration(
  declarationId: string,
  finalText: string
) {
  try {
    const { data: declaration, error } = await supabase
      .from('declarations')
      .update({
        final_text: finalText,
        sealed_at: new Date().toISOString(),
      })
      .eq('id', declarationId)
      .select()
      .single();

    if (error) throw error;

    // Record the attempt
    await supabase.from('session_attempts').insert({
      declaration_id: declarationId,
      completed_at: new Date().toISOString(),
    });

    return declaration;
  } catch (err) {
    console.error('[v0] Error sealing declaration:', err);
    throw err;
  }
}

/**
 * Generate a random coupling code
 */
function generateCouplingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Get user's session history
 */
export async function getUserSessionHistory(userId: string) {
  try {
    const { data: sessions, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return sessions || [];
  } catch (err) {
    console.error('[v0] Error fetching user session history:', err);
    throw err;
  }
}

/**
 * Get couple's declarations
 */
export async function getCoupleDeclarations(coupleId: string) {
  try {
    const { data: declarations, error } = await supabase
      .from('declarations')
      .select('*')
      .eq('couple_id', coupleId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return declarations || [];
  } catch (err) {
    console.error('[v0] Error fetching couple declarations:', err);
    throw err;
  }
}
