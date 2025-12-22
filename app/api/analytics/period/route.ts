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
