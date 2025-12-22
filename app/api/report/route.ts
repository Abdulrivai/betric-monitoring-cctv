import { NextResponse } from 'next/server';
import { getAdminSupabase } from '../../../lib/supabase';
import jsPDF from 'jspdf';

export async function GET(req: Request) {
  const u = new URL(req.url);
  const fromStr = u.searchParams.get('from')!;
  const toStr = u.searchParams.get('to')!;
  const from = new Date(fromStr);
  const to = new Date(toStr);
  const supabase = getAdminSupabase();
  const { data: cameras } = await supabase.from('cameras').select('*').order('id');
  const totalMs = to.getTime() - from.getTime();
  const results: any[] = [];
  for (const cam of cameras ?? []) {
    const { data: statusesInRange } = await supabase
      .from('camera_status')
      .select('id,camera_id,is_online,at')
      .eq('camera_id', cam.id)
      .gte('at', from.toISOString())
      .lte('at', to.toISOString())
      .order('at');

    const { data: prevStatus } = await supabase
      .from('camera_status')
      .select('id,camera_id,is_online,at')
      .eq('camera_id', cam.id)
      .lte('at', from.toISOString())
      .order('at', { ascending: false })
      .limit(1);

    let lastOnline = prevStatus && prevStatus.length ? prevStatus[0].is_online : true;
    let lastTime = from.getTime();
    let offlineMs = 0;
    for (const s of statusesInRange ?? []) {
      const t = new Date(s.at).getTime();
      if (!lastOnline) offlineMs += t - lastTime;
      lastOnline = s.is_online;
      lastTime = t;
    }
    if (!lastOnline) offlineMs += to.getTime() - lastTime;

    const uptimePct = Math.max(0, 100 - (offlineMs / totalMs) * 100);

    const { data: ev } = await supabase
      .from('evidence')
      .select('path,captured_at,type')
      .eq('camera_id', cam.id)
      .gte('captured_at', from.toISOString())
      .lte('captured_at', to.toISOString())
      .order('captured_at', { ascending: false })
      .limit(1);

    let evidenceUrl = null;
    if (ev && ev.length) {
      const url = supabase.storage.from(process.env.SUPABASE_EVIDENCE_BUCKET!).getPublicUrl(ev[0].path);
      evidenceUrl = url.data.publicUrl;
    }
    results.push({ camera_id: cam.id, code: cam.code, offline_ms: offlineMs, uptime_pct: uptimePct, evidence_url: evidenceUrl });
  }
  return NextResponse.json({ from: fromStr, to: toStr, total_ms: totalMs, cameras: results });
}