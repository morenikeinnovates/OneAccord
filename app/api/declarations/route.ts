import { supabase } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET: Fetch declarations for a user/couple
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const coupleId = searchParams.get('coupleId');
    const userId = searchParams.get('userId');

    if (!coupleId && !userId) {
      return NextResponse.json(
        { error: 'coupleId or userId is required' },
        { status: 400 }
      );
    }

    let query = supabase.from('declarations').select('*');

    if (coupleId) {
      query = query.eq('couple_id', coupleId);
    } else if (userId) {
      // Get declarations for couples the user is in
      const { data: couples } = await supabase
        .from('couples')
        .select('id')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (couples && couples.length > 0) {
        const coupleIds = couples.map((c) => c.id);
        query = query.in('couple_id', coupleIds);
      } else {
        return NextResponse.json([]);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// POST: Create or update a declaration
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { declaration_id, final_text, user1_approved, user2_approved } = body;

    if (!declaration_id) {
      return NextResponse.json(
        { error: 'declaration_id is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, any> = {};

    if (final_text !== undefined) {
      updateData.final_text = final_text;
    }

    if (user1_approved !== undefined) {
      updateData.user1_approved = user1_approved;
    }

    if (user2_approved !== undefined) {
      updateData.user2_approved = user2_approved;
    }

    // If both are approved, seal it
    if (user1_approved && user2_approved) {
      updateData.sealed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('declarations')
      .update(updateData)
      .eq('id', declaration_id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
