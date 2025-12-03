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

        // Verificar el rol del usuario
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        // Si es admin, puede eliminar cualquier cita cancelada o completada
        if (profile?.role === 'admin') {
            // Verificar que todas las citas sean canceladas o completadas
            const { data: appointments } = await supabase
                .from('appointments')
                .select('id, status')
                .in('id', appointmentIds);

            const invalidAppointments = appointments?.filter(
                apt => apt.status !== 'cancelled' && apt.status !== 'completed'
            );

            if (invalidAppointments && invalidAppointments.length > 0) {
                return NextResponse.json(
                    { error: 'Solo se pueden eliminar citas canceladas o completadas' },
                    { status: 400 }
                );
            }

            // Eliminar las citas
            const { error } = await supabase
                .from('appointments')
                .delete()
                .in('id', appointmentIds);

            if (error) {
                console.error('Error eliminando citas:', error);
                return NextResponse.json({ error: 'Error al eliminar las citas' }, { status: 500 });
            }

            return NextResponse.json({
                success: true,
                message: `${appointmentIds.length} cita(s) eliminada(s) exitosamente`
            });
        }

        // Si es cliente, solo puede eliminar sus propias citas canceladas o completadas
        const { data: appointments } = await supabase
            .from('appointments')
            .select('id, status, client_id')
            .in('id', appointmentIds)
            .eq('client_id', user.id);

        if (!appointments || appointments.length !== appointmentIds.length) {
            return NextResponse.json(
                { error: 'No tienes permiso para eliminar estas citas' },
                { status: 403 }
            );
        }

        const invalidAppointments = appointments.filter(
            apt => apt.status !== 'cancelled' && apt.status !== 'completed'
        );

        if (invalidAppointments.length > 0) {
            return NextResponse.json(
                { error: 'Solo se pueden eliminar citas canceladas o completadas' },
                { status: 400 }
            );
        }

        // Eliminar las citas
        const { error } = await supabase
            .from('appointments')
            .delete()
            .in('id', appointmentIds)
            .eq('client_id', user.id);

        if (error) {
            console.error('Error eliminando citas:', error);
            return NextResponse.json({ error: 'Error al eliminar las citas' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `${appointmentIds.length} cita(s) eliminada(s) exitosamente`
        });

    } catch (error) {
        console.error('Error en delete-appointments:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
