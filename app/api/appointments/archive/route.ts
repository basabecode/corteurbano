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

        const { appointmentIds } = await request.json();

        if (!appointmentIds || !Array.isArray(appointmentIds) || appointmentIds.length === 0) {
            return NextResponse.json({ error: 'IDs de citas inválidos' }, { status: 400 });
        }

        // Verificar que el usuario sea el dueño de las citas y que estén completadas
        const { data: appointments } = await supabase
            .from('appointments')
            .select('id, status, client_id')
            .in('id', appointmentIds)
            .eq('client_id', user.id);

        if (!appointments || appointments.length !== appointmentIds.length) {
            return NextResponse.json(
                { error: 'No tienes permiso para archivar estas citas' },
                { status: 403 }
            );
        }

        const invalidAppointments = appointments.filter(
            apt => apt.status !== 'completed'
        );

        if (invalidAppointments.length > 0) {
            return NextResponse.json(
                { error: 'Solo se pueden archivar citas completadas' },
                { status: 400 }
            );
        }

        // Eliminar las citas completadas (archivar = eliminar del historial)
        const { error } = await supabase
            .from('appointments')
            .delete()
            .in('id', appointmentIds)
            .eq('client_id', user.id);

        if (error) {
            console.error('Error archivando citas:', error);
            return NextResponse.json({ error: 'Error al archivar las citas' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `${appointmentIds.length} cita(s) archivada(s) exitosamente`
        });

    } catch (error) {
        console.error('Error en archive-appointments:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
