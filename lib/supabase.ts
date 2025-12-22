import { createClient } from '@supabase/supabase-js';

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

export type Camera = { id: number; code: string; name: string | null; location: string | null; is_active: boolean | null };
export type CameraStatus = { id: number; camera_id: number; is_online: boolean; at: string; source: string | null };
export type Evidence = { id: number; camera_id: number; status_id: number | null; captured_at: string; path: string; type: string; note: string | null };