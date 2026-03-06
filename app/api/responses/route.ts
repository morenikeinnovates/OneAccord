import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch responses for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('responses')
      .select('*')
      .eq('session_id', sessionId);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// POST: Save responses for a session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, user_id, step, responses_json } = body;

    if (!session_id || !user_id || !step || !responses_json) {
      return NextResponse.json(
        { error: 'session_id, user_id, step, and responses_json are required' },
        { status: 400 }
      );
    }

    // Check if response already exists for this step
    const { data: existing } = await supabase
      .from('responses')
      .select('id')
      .eq('session_id', session_id)
      .eq('user_id', user_id)
      .eq('step', step)
      .single();

    let result;

    if (existing) {
      // Update existing response
      result = await supabase
        .from('responses')
        .update({
          responses_json,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();
    } else {
      // Insert new response
      result = await supabase
        .from('responses')
        .insert([
          {
            session_id,
            user_id,
            step,
            responses_json,
          },
        ])
        .select()
        .single();
    }

    if (result.error) throw result.error;

    return NextResponse.json(result.data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
