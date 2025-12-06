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

        // Obtener las citas con toda la información necesaria
        const { data: appointments, error: fetchError } = await supabase
            .from('appointments')
            .select(`
                id,
                client_id,
                service_id,
                start_time,
                status,
                cancellation_reason,
                created_at,
                service:services (
                    name,
                    price,
                    duration_minutes
                ),
                client:profiles!appointments_client_id_fkey (
                    full_name
                )
            `)
            .in('id', appointmentIds)
            .in('status', ['completed', 'cancelled']);

        if (fetchError) {
            console.error('Error fetching appointments:', fetchError);
            return NextResponse.json({ error: 'Error al obtener las citas' }, { status: 500 });
        }

        if (!appointments || appointments.length === 0) {
            return NextResponse.json({ error: 'No se encontraron citas para archivar' }, { status: 404 });
        }

        // Preparar datos para el historial
        const historyRecords = appointments.map(apt => {
            const service = Array.isArray(apt.service) ? apt.service[0] : apt.service;
            const client = Array.isArray(apt.client) ? apt.client[0] : apt.client;

            // Calcular end_time basado en start_time + duración del servicio
            const startTime = new Date(apt.start_time);
            const durationMinutes = service?.duration_minutes || 30;
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);

            return {
                original_appointment_id: apt.id,
                client_id: apt.client_id,
                service_id: apt.service_id,
                start_time: apt.start_time,
                end_time: endTime.toISOString(),
                status: apt.status || 'completed',
                price: Number(service?.price) || 0, // Columna antigua que existe en la tabla
                cancellation_reason: apt.cancellation_reason || null,
                created_at: apt.created_at || new Date().toISOString(),
                service_name: service?.name || 'Servicio no especificado',
                service_price: Number(service?.price) || 0,
                service_duration_minutes: durationMinutes,
                client_name: client?.full_name || 'Cliente desconocido',
                client_phone: '',
                client_email: ''
            };
        });

        // Insertar en el historial
        const { error: insertError } = await supabase
            .from('appointments_history')
            .insert(historyRecords);

        if (insertError) {
            console.error('Error inserting history:', insertError);
            return NextResponse.json({ error: 'Error al archivar las citas' }, { status: 500 });
        }

        // Eliminar las citas originales
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
            message: `${appointments.length} cita(s) archivada(s) exitosamente`,
            archived: appointments.length
        });

    } catch (error) {
        console.error('Error en archive-admin:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
