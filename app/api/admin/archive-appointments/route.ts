import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST() {
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

    // Llamar a la función de archivo
    const { data, error } = await supabase.rpc('archive_old_appointments');

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        success: true,
        archivedCount: data || 0,
        message: `${data || 0} citas archivadas exitosamente`
    });
}
