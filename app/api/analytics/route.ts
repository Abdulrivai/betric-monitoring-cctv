import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        // Fetch camera daily data untuk tanggal tertentu
        const { data: cameraData, error: cameraError } = await supabase
            .from('camera_daily_data')
            .select(`
        *,
        cameras (
          id,
          code,
          name,
          location
        )
      `)
            .eq('date', date)
            .order('camera_id', { ascending: true });

        if (cameraError) throw cameraError;

        // Fetch daily analytics summary
        const { data: analyticsData, error: analyticsError } = await supabase
            .from('daily_analytics')
            .select('*')
            .eq('date', date)
            .single();

        if (analyticsError && analyticsError.code !== 'PGRST116') {
            throw analyticsError;
        }

        return NextResponse.json({
            success: true,
            date,
            cameras: cameraData || [],
            summary: analyticsData || {
                total_cameras: 0,
                total_online: 0,
                total_offline: 0,
                avg_uptime: 0,
                total_incidents: 0
            }
        });
    } catch (error: any) {
        console.error('Analytics API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { date } = body;

        const adminSupabase = getAdminSupabase();

        // Fetch all cameras
        const { data: cameras, error: camerasError } = await adminSupabase
            .from('cameras')
            .select('id')
            .order('id', { ascending: true });

        if (camerasError) throw camerasError;

        // Check existing data for this date
        const { data: existingData, error: existingError } = await adminSupabase
            .from('camera_daily_data')
            .select('camera_id')
            .eq('date', date);

        if (existingError) throw existingError;

        const existingCameraIds = new Set(existingData?.map(d => d.camera_id) || []);

        // Prepare new records for cameras that don't have data yet
        const newRecords = cameras
            .filter(camera => !existingCameraIds.has(camera.id))
            .map(camera => ({
                camera_id: camera.id,
                date: date,
                is_online: false,
                playback_status: 'OK',
                uptime_pct: 0,
                usage: '',
                note: '',
                incidents: 0
            }));

        if (newRecords.length > 0) {
            const { error: insertError } = await adminSupabase
                .from('camera_daily_data')
                .insert(newRecords);

            if (insertError) throw insertError;
        }

        // Regenerate daily analytics
        await adminSupabase.rpc('generate_daily_analytics', { target_date: date });

        return NextResponse.json({
            success: true,
            message: `Initialized ${newRecords.length} camera records for ${date}`
        });
    } catch (error: any) {
        console.error('Analytics Initialize Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { updates, date } = body;

        // Bulk update camera daily data
        if (!updates || !Array.isArray(updates)) {
            throw new Error('Updates must be an array');
        }

        const adminSupabase = getAdminSupabase();

        // Process each update
        for (const update of updates) {
            const { camera_id, is_online, playback_status, usage, note } = update;

            // Auto-calculate uptime_pct based on online status
            const uptime_pct = is_online ? 100 : 0;

            const { error } = await adminSupabase
                .from('camera_daily_data')
                .update({
                    is_online,
                    playback_status,
                    uptime_pct,
                    usage,
                    note,
                    updated_at: new Date().toISOString()
                })
                .eq('camera_id', camera_id)
                .eq('date', date);

            if (error) throw error;
        }

        // Regenerate daily analytics
        await adminSupabase.rpc('generate_daily_analytics', { target_date: date });

        return NextResponse.json({
            success: true,
            message: `Updated ${updates.length} camera records`
        });
    } catch (error: any) {
        console.error('Analytics Update Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            throw new Error('Date parameter is required');
        }

        const adminSupabase = getAdminSupabase();

        // Delete all camera daily data for this date
        const { error } = await adminSupabase
            .from('camera_daily_data')
            .delete()
            .eq('date', date);

        if (error) throw error;

        // Delete daily analytics for this date
        await adminSupabase
            .from('daily_analytics')
            .delete()
            .eq('date', date);

        return NextResponse.json({
            success: true,
            message: `Deleted all data for ${date}`
        });
    } catch (error: any) {
        console.error('Analytics Delete Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
