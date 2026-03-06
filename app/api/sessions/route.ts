import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch user's sessions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// POST: Create a new session
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, category_key, mode, couple_id } = body;

    if (!user_id || !category_key || !mode) {
      return NextResponse.json(
        { error: 'user_id, category_key, and mode are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('sessions')
      .insert([
        {
          user_id,
          category_key,
          mode,
          couple_id: couple_id || null,
          status: 'in-progress',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
