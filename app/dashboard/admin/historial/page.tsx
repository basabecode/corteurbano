import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { HistorialAdminContent } from './components/HistorialAdminContent';
import { Breadcrumb } from '@/app/dashboard/components/Breadcrumb';

async function getHistorialData() {
    const supabase = createSupabaseServerClient();

    // Verificar autenticación y rol
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect('/login');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        redirect('/dashboard/customer');
    }

    // Obtener citas ARCHIVADAS
    const { data: archivedAppointments, error: archiveError } = await supabase
        .from('appointments_history')
        .select('*')
        .order('archived_at', { ascending: false });

    // Obtener citas COMPLETADAS que AÚN NO se han archivado
    const { data: activeCompleted, error: activeError } = await supabase
        .from('appointments')
        .select(`
            id,
            start_time,
            services (
                name,
                price,
                duration_minutes
            )
        `)
        .eq('status', 'completed');

    if (archiveError || activeError) {
        console.error('Error fetching appointments:', archiveError || activeError);
        return { archivedAppointments: [], activeCompleted: [] };
    }

    return {
        archivedAppointments: archivedAppointments || [],
        activeCompleted: activeCompleted || []
    };
}

export default async function HistorialAdminPage() {
    const { archivedAppointments, activeCompleted } = await getHistorialData();

    return (
        <div className="space-y-6">
            <Breadcrumb
                items={[
                    { label: 'Panel Admin', href: '/dashboard/admin' },
                    { label: 'Historial' },
                ]}
            />
            <HistorialAdminContent
                appointments={archivedAppointments}
                activeCompleted={activeCompleted}
            />
        </div>
    );
}
