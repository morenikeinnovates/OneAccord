import { generateText } from 'ai';
import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, couple_id, category_key } = body;

    if (!session_id || !couple_id || !category_key) {
      return NextResponse.json(
        { error: 'session_id, couple_id, and category_key are required' },
        { status: 400 }
      );
    }

    // Get all responses for this session
    const { data: responses, error: responseError } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', session_id);

    if (responseError) throw responseError;

    // Get couple information
    const { data: couple, error: coupleError } = await supabase
      .from('couples')
      .select('*')
      .eq('id', couple_id)
      .single();

    if (coupleError) throw coupleError;

    // Get both users' profiles for context
    const { data: user1, error: user1Error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', couple.user1_id)
      .single();

    const { data: user2, error: user2Error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', couple.user2_id)
      .single();

    if (user1Error || user2Error) throw user1Error || user2Error;

    // Build context from responses
    const responsesByUser: Record<string, any> = {};
    if (responses) {
      responses.forEach((r) => {
        if (!responsesByUser[r.user_id]) {
          responsesByUser[r.user_id] = {};
        }
        responsesByUser[r.user_id][r.step] = r.responses_json;
      });
    }

    // Create prompt for AI to generate declaration
    const prompt = `You are an expert couples counselor and relationship coach. Based on the responses from a couple's guided conversation, generate a thoughtful, affirming couple's declaration that captures their shared values and commitments.

**Category:** ${category_key}

**User 1 (${user1.email}) Responses:**
${JSON.stringify(responsesByUser[user1.id] || {}, null, 2)}

**User 2 (${user2.email}) Responses:**
${JSON.stringify(responsesByUser[user2.id] || {}, null, 2)}

**Task:** Create a couple's declaration that:
1. Reflects both their individual stories and their shared vision
2. Is personal, meaningful, and affirming
3. Uses inclusive language ("we", "our", "us")
4. Is approximately 150-250 words
5. Can be read aloud or printed as a keepsake
6. Honors their faith perspective where appropriate
7. Captures key commitments they've discussed

Generate a declaration that feels authentic to their journey together. Format it as a cohesive paragraph that can be easily read and sealed.`;

    // Call AI to generate declaration
    const result = await generateText({
      model: 'openai/gpt-4o',
      prompt,
      temperature: 0.8,
      maxTokens: 500,
    });

    // Save draft declaration to database
    const { data: declaration, error: declError } = await supabase
      .from('declarations')
      .insert([
        {
          session_id,
          couple_id,
          draft_text: result.text,
          ai_generated: true,
        },
      ])
      .select()
      .single();

    if (declError) throw declError;

    return NextResponse.json(declaration, { status: 201 });
  } catch (err: any) {
    console.error('Declaration generation error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate declaration' },
      { status: 500 }
    );
  }
}
