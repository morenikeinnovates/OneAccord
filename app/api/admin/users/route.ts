import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all users with their profiles and couple info
export async function GET(request: NextRequest) {
  try {
    // Verify admin access (in production, check for admin role)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all profiles with couple information
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        relationship_stage,
        couple_id,
        created_at,
        couples (
          id,
          user1_id,
          user2_id,
          coupling_code,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (profileError) throw profileError;

    return NextResponse.json(profiles);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}

// POST: Create a new admin user (requires super admin)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, relationship_stage } = body;

    if (!email || !relationship_stage) {
      return NextResponse.json(
        { error: 'email and relationship_stage are required' },
        { status: 400 }
      );
    }

    // Create auth user via admin API
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: crypto.getRandomValues(new Uint8Array(32)).toString(),
      email_confirm: true,
    });

    if (error) throw error;

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          email,
          relationship_stage,
        },
      ])
      .select()
      .single();

    if (profileError) throw profileError;

    return NextResponse.json(profile, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
