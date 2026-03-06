import { supabase, supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// GET: Fetch user's couples
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
      .from('couples')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// POST: Create a new couple or join existing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, coupling_code } = body;

    if (!user_id || !action) {
      return NextResponse.json(
        { error: 'user_id and action are required' },
        { status: 400 }
      );
    }

    if (action === 'create') {
      // Create a new couple with a generated code
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();

      const { data, error } = await supabase
        .from('couples')
        .insert([
          {
            user1_id,
            user2_id: user_id, // placeholder, will be updated when partner joins
            coupling_code: code,
            status: 'pending',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return NextResponse.json(data, { status: 201 });
    } else if (action === 'join') {
      // Join an existing couple using the coupling code
      if (!coupling_code) {
        return NextResponse.json(
          { error: 'coupling_code is required to join' },
          { status: 400 }
        );
      }

      // Find the couple with this code
      const { data: couple, error: findError } = await supabase
        .from('couples')
        .select('*')
        .eq('coupling_code', coupling_code)
        .single();

      if (findError || !couple) {
        return NextResponse.json(
          { error: 'Invalid coupling code' },
          { status: 404 }
        );
      }

      // Check if user is already in a couple
      const { data: existing } = await supabase
        .from('couples')
        .select('*')
        .or(`user1_id.eq.${user_id},user2_id.eq.${user_id}`)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'User is already in a couple' },
          { status: 400 }
        );
      }

      // Update the couple to add the second user
      const { data: updated, error: updateError } = await supabase
        .from('couples')
        .update({
          user2_id: user_id,
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', couple.id)
        .select()
        .single();

      if (updateError) throw updateError;

      // Update both profiles to reference the couple
      await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', couple.user1_id);

      await supabase
        .from('profiles')
        .update({ couple_id: couple.id })
        .eq('id', user_id);

      return NextResponse.json(updated, { status: 200 });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
