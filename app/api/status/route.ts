import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();
  const supabase = getAdminSupabase();
  const { data, error } = await supabase
    .from('camera_status')
    .insert([{ camera_id: body.camera_id, is_online: body.is_online, at: body.at, source: body.source ?? null }])
    .select('*')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, id: data.id });
}