import { NextResponse } from 'next/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

/**
 * Endpoint para marcar automáticamente citas pasadas como completadas
 * Se puede llamar mediante un cron job o manualmente
 */
export async function POST() {
    try {
        const supabase = createSupabaseServiceClient();

        // Obtener la fecha/hora actual
        const now = new Date().toISOString();

        // Buscar citas confirmadas cuya fecha ya pasó
        const { data: pastAppointments, error: fetchError } = await supabase
            .from('appointments')
            .select('id, start_time, status')
            .eq('status', 'confirmed')
            .lt('start_time', now);

        if (fetchError) {
            console.error('Error fetching past appointments:', fetchError);
            return NextResponse.json(
                { error: 'Error al obtener citas pasadas' },
                { status: 500 }
            );
        }

        if (!pastAppointments || pastAppointments.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No hay citas para completar',
                updated: 0
            });
        }

        // Actualizar todas las citas pasadas a "completed"
        const appointmentIds = pastAppointments.map(apt => apt.id);

        const { error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'completed' })
            .in('id', appointmentIds);

        if (updateError) {
            console.error('Error updating appointments:', updateError);
            return NextResponse.json(
                { error: 'Error al actualizar citas' },
                { status: 500 }
            );
        }

        console.log(`✅ ${appointmentIds.length} citas marcadas como completadas`);

        return NextResponse.json({
            success: true,
            message: `${appointmentIds.length} cita(s) marcada(s) como completadas`,
            updated: appointmentIds.length,
            appointmentIds
        });

    } catch (error) {
        console.error('Error in complete-past-appointments:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// También permitir GET para facilitar llamadas desde cron jobs
export async function GET() {
    return POST();
}
