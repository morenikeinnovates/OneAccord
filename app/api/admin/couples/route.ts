import { supabaseAdmin } from '@/lib/supabase';
import { NextRequest, NextResponse } from 'next/server';

// GET: List all couples with session counts
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all couples with their members and session info
    const { data: couples, error: couplesError } = await supabaseAdmin
      .from('couples')
      .select(`
        id,
        user1_id,
        user2_id,
        coupling_code,
        status,
        created_at,
        updated_at,
        sessions (
          id,
          category_key,
          status,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    if (couplesError) throw couplesError;

    // Enrich with profile data
    const enriched = await Promise.all(
      couples.map(async (couple) => {
        const { data: user1 } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', couple.user1_id)
          .single();

        const { data: user2 } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', couple.user2_id)
          .single();

        return {
          ...couple,
          user1_email: user1?.email,
          user2_email: user2?.email,
          session_count: couple.sessions?.length || 0,
          completed_sessions: couple.sessions?.filter((s: any) => s.status === 'completed').length || 0,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    );
  }
}
