import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const start = searchParams.get('start');
        const end = searchParams.get('end');

        if (!start || !end) {
            return NextResponse.json(
                { success: false, error: 'Start and end dates are required' },
                { status: 400 }
            );
        }

        // Fetch daily analytics untuk range tanggal
        const { data: analyticsData, error } = await supabase
            .from('daily_analytics')
            .select('*')
            .gte('date', start)
            .lte('date', end)
            .order('date', { ascending: false });

        if (error) throw error;

        // Fetch camera details with average stats for the period
        const { data: cameraDetailsData, error: cameraError } = await supabase
            .from('camera_daily_data')
            .select(`
                camera_id,
                is_online,
                uptime_pct,
                cameras (
                    id,
                    code,
                    name,
                    location
                )
            `)
            .gte('date', start)
            .lte('date', end);

        if (cameraError) throw cameraError;

        // Group by camera and calculate averages
        const cameraStats = new Map();

        cameraDetailsData?.forEach((record: any) => {
            const cameraId = record.camera_id;
            if (!cameraStats.has(cameraId)) {
                cameraStats.set(cameraId, {
                    camera_id: cameraId,
                    camera_code: record.cameras.code,
                    camera_name: record.cameras.name,
                    camera_location: record.cameras.location,
                    total_days: 0,
                    online_days: 0,
                    total_uptime: 0
                });
            }

            const stats = cameraStats.get(cameraId);
            stats.total_days++;
            if (record.is_online) stats.online_days++;
            stats.total_uptime += record.uptime_pct || 0;
        });

        // Calculate averages and format camera list
        const cameraList = Array.from(cameraStats.values()).map((stats: any) => ({
            camera_id: stats.camera_id,
            code: stats.camera_code,
            name: stats.camera_name,
            location: stats.camera_location,
            avg_uptime: stats.total_days > 0 ? (stats.total_uptime / stats.total_days) : 0,
            online_percentage: stats.total_days > 0 ? ((stats.online_days / stats.total_days) * 100) : 0,
            online_days: stats.online_days,
            total_days: stats.total_days
        })).sort((a, b) => a.code.localeCompare(b.code));

        // Calculate average summary
        const summary = {
            total_cameras: analyticsData.length > 0 ? analyticsData[0].total_cameras : 0,
            total_online: Math.round(
                analyticsData.reduce((sum, day) => sum + day.total_online, 0) / (analyticsData.length || 1)
            ),
            total_offline: Math.round(
                analyticsData.reduce((sum, day) => sum + day.total_offline, 0) / (analyticsData.length || 1)
            ),
            avg_uptime: analyticsData.reduce((sum, day) => sum + day.avg_uptime, 0) / (analyticsData.length || 1),
            total_incidents: analyticsData.reduce((sum, day) => sum + day.total_incidents, 0)
        };

        return NextResponse.json({
            success: true,
            start,
            end,
            days: analyticsData.length,
            summary,
            cameras: cameraList,
            data: analyticsData
        });
    } catch (error: any) {
        console.error('Period Analytics API Error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
