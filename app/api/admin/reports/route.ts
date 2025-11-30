import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    const supabase = createSupabaseServerClient();

    // Verificar que sea admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'admin') {
        return NextResponse.json({ error: 'Solo administradores' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    // Obtener reportes mensuales
    const { data: reports, error } = await supabase
        .from('appointments_history')
        .select('start_time, status, price')
        .gte('start_time', new Date(Date.now() - months * 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('start_time', { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Agrupar por mes
    const monthlyData: Record<string, {
        month: string;
        completed: number;
        cancelled: number;
        revenue: number;
        total: number;
    }> = {};

    reports?.forEach(appointment => {
        const date = new Date(appointment.start_time);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                completed: 0,
                cancelled: 0,
                revenue: 0,
                total: 0
            };
        }

        monthlyData[monthKey].total++;
        if (appointment.status === 'completed') {
            monthlyData[monthKey].completed++;
            monthlyData[monthKey].revenue += Number(appointment.price);
        } else if (appointment.status === 'cancelled') {
            monthlyData[monthKey].cancelled++;
        }
    });

    const sortedReports = Object.values(monthlyData).sort((a, b) =>
        b.month.localeCompare(a.month)
    );

    return NextResponse.json({ reports: sortedReports });
}
