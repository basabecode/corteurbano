import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HistorialContent } from './components/HistorialContent';

export const metadata = {
    title: 'Historial de Citas - BarberKing',
    description: 'Consulta tu historial de cortes y citas archivadas'
};

export default async function HistorialPage() {
    const supabase = createSupabaseServerClient();

    // Verificar autenticación
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Obtener perfil
    const { data: profile } = await supabase
        .from('profiles')
        .select('role, full_name, email')
        .eq('id', user.id)
        .single();

    // Solo clientes pueden acceder
    if (profile?.role !== 'customer') {
        redirect('/dashboard/admin');
    }

    // Obtener historial de citas archivadas
    const { data: archivedAppointments } = await supabase
        .from('appointments_history')
        .select(`
            id,
            start_time,
            status,
            service_name,
            service_price,
            service_duration_minutes,
            archived_at,
            cancellation_reason
        `)
        .eq('client_id', user.id)
        .order('archived_at', { ascending: false });

    return (
        <div className="min-h-screen bg-slate-950">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                <HistorialContent
                    archivedAppointments={archivedAppointments || []}
                    userEmail={user.email || ''}
                    userName={profile?.full_name || ''}
                />
            </div>
        </div>
    );
}
