import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

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

        // Obtener las citas con la información del servicio
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
                services (
                    name,
                    price,
                    duration_minutes
                )
            `)
            .in('id', appointmentIds)
            .eq('client_id', user.id)
            .eq('status', 'completed');

        if (fetchError) {
            console.error('Error obteniendo citas:', fetchError);
            return NextResponse.json({
                error: 'Error al obtener las citas',
                details: fetchError.message
            }, { status: 500 });
        }

        if (!appointments || appointments.length === 0) {
            return NextResponse.json(
                { error: 'No se encontraron citas completadas para archivar' },
                { status: 404 }
            );
        }

        if (appointments.length !== appointmentIds.length) {
            return NextResponse.json(
                { error: 'Solo puedes archivar tus propias citas completadas' },
                { status: 403 }
            );
        }

        // Obtener información del perfil del cliente
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .single();

        // Preparar datos para el historial
        const historyRecords = appointments.map(apt => {
            const service = Array.isArray(apt.services) ? apt.services[0] : apt.services;

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
                client_name: profile?.full_name || user.email?.split('@')[0] || 'Cliente',
                client_phone: '',
                client_email: user.email || ''
            };
        });

        // Insertar en appointments_history usando el Service Client para bypass RLS
        const serviceClient = createSupabaseServiceClient();

        const { error: insertError } = await serviceClient
            .from('appointments_history')
            .insert(historyRecords);

        if (insertError) {
            console.error('Error archivando citas:', insertError);
            return NextResponse.json({
                error: 'Error al archivar las citas',
                details: insertError.message
            }, { status: 500 });
        }

        // Eliminar de appointments usando el Service Client para bypass RLS
        const { error: deleteError } = await serviceClient
            .from('appointments')
            .delete()
            .in('id', appointmentIds);

        if (deleteError) {
            console.error('Error eliminando citas originales:', deleteError);
            return NextResponse.json({ error: 'Error al completar el archivado' }, { status: 500 });
        }

        console.log(`✅ ${appointmentIds.length} cita(s) eliminadas de appointments`);

        return NextResponse.json({
            success: true,
            message: `${appointmentIds.length} cita(s) archivada(s) exitosamente. Puedes consultarlas en tu historial.`
        });

    } catch (error) {
        console.error('Error en archive-appointments:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}


