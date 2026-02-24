import { createClient } from '@supabase/supabase-js';

/** Emails de usuarios de prueba — para limpiarlos después */
const TEST_EMAILS: string[] = [];

export function createTestSupabaseClient() {
    const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    return createClient(supabaseUrl, supabaseKey);
}

export function createTestSupabaseServiceClient() {
    const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;
    return createClient(supabaseUrl, serviceKey);
}

/**
 * Crea un usuario de prueba en auth.users + profiles.
 * Usa supabase.auth.admin para crear el usuario con UUID real.
 */
export async function createTestUser(data: {
    email: string;
    fullName: string;
    role?: 'customer' | 'admin';
    phone?: string;
    /** @deprecated — ignorado, Supabase genera el UUID real */
    id?: string;
}) {
    const supabase = createTestSupabaseServiceClient();

    // Registrar email para limpieza posterior
    TEST_EMAILS.push(data.email);

    // 1. Crear (o recuperar) el usuario en auth
    let userId: string;
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existing = existingUsers?.users.find(u => u.email === data.email);

    if (existing) {
        userId = existing.id;
    } else {
        const { data: created, error: authError } = await supabase.auth.admin.createUser({
            email: data.email,
            password: 'Test@Password123!',
            email_confirm: true,
            user_metadata: { full_name: data.fullName },
        });
        if (authError) throw authError;
        userId = created.user.id;
    }

    // 2. Upsert del perfil (puede auto-crearse por trigger; upsert es seguro)
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .upsert({
            id: userId,
            email: data.email,
            full_name: data.fullName,
            role: data.role || 'customer',
            phone: data.phone || null,
        }, { onConflict: 'id' })
        .select()
        .single();

    if (profileError) throw profileError;
    return profile;
}

/**
 * Limpia datos de prueba: citas y usuarios de auth creados durante los tests.
 */
export async function cleanupTestData() {
    const supabase = createTestSupabaseServiceClient();

    // Eliminar citas de usuarios de prueba
    if (TEST_EMAILS.length > 0) {
        const { data: profiles } = await supabase
            .from('profiles')
            .select('id')
            .in('email', TEST_EMAILS);

        if (profiles && profiles.length > 0) {
            const ids = profiles.map(p => p.id);
            await supabase.from('appointments').delete().in('client_id', ids);
        }
    }

    // Eliminar usuarios de auth
    for (const email of TEST_EMAILS) {
        const { data: users } = await supabase.auth.admin.listUsers();
        const user = users?.users.find(u => u.email === email);
        if (user) {
            await supabase.auth.admin.deleteUser(user.id);
        }
    }

    TEST_EMAILS.length = 0;
}

export async function createTestAppointment(data: {
    clientId: string;
    serviceId: string;
    startTime: string;
    status?: 'pending' | 'confirmed' | 'completed' | 'cancelled';
}) {
    const supabase = createTestSupabaseServiceClient();

    const { data: appointment, error } = await supabase
        .from('appointments')
        .insert({
            client_id: data.clientId,
            service_id: data.serviceId,
            start_time: data.startTime,
            status: data.status || 'pending',
        })
        .select()
        .single();

    if (error) throw error;
    return appointment;
}

export async function testUserExists(email: string): Promise<boolean> {
    const supabase = createTestSupabaseServiceClient();
    try {
        const { data } = await supabase.auth.admin.listUsers();
        return data?.users.some(u => u.email === email) || false;
    } catch {
        return false;
    }
}

export async function getTestServices() {
    const supabase = createTestSupabaseClient();
    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
}

export async function deleteTestAppointments(clientId?: string) {
    const supabase = createTestSupabaseServiceClient();
    let query = supabase.from('appointments').delete();
    if (clientId) {
        query = query.eq('client_id', clientId);
    } else {
        query = query.ilike('client_id', 'test-%');
    }
    const { error } = await query;
    if (error) throw error;
}
