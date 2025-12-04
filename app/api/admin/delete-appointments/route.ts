import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = createSupabaseServerClient();

        // Verificar autenticación
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Verificar que sea admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { appointmentIds } = await request.json();

        if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
            return NextResponse.json({ error: 'IDs de citas inválidos' }, { status: 400 });
        }

        // Verificar que solo sean citas canceladas
        const { data: appointments, error: fetchError } = await supabase
            .from('appointments')
            .select('id, status')
            .in('id', appointmentIds);

        if (fetchError) {
            return NextResponse.json({ error: 'Error al verificar citas' }, { status: 500 });
        }

        const invalidAppointments = appointments?.filter(a => a.status !== 'cancelled');
        if (invalidAppointments && invalidAppointments.length > 0) {
            return NextResponse.json({
                error: 'Solo se pueden eliminar permanentemente las citas canceladas. Las citas completadas deben ser archivadas.'
            }, { status: 400 });
        }

        // Eliminar las citas
        const { error: deleteError } = await supabase
            .from('appointments')
            .delete()
            .in('id', appointmentIds);

        if (deleteError) {
            console.error('Error deleting appointments:', deleteError);
            return NextResponse.json({ error: 'Error al eliminar las citas' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `${appointmentIds.length} cita(s) eliminada(s) permanentemente`
        });

    } catch (error) {
        console.error('Error en admin-delete:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
