import { createClient } from '@supabase/supabase-js';

/**
 * Create a Supabase client for testing
 * Uses test environment variables
 */
export function createTestSupabaseClient() {
    const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.TEST_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return createClient(supabaseUrl, supabaseKey);
}

/**
 * Create a Supabase service client for testing (admin access)
 */
export function createTestSupabaseServiceClient() {
    const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

    return createClient(supabaseUrl, serviceKey);
}

/**
 * Clean up test data from database
 */
export async function cleanupTestData() {
    const supabase = createTestSupabaseServiceClient();

    // Delete test appointments
    await supabase.from('appointments').delete().ilike('client_id', 'test-%');

    // Delete test profiles
    await supabase.from('profiles').delete().ilike('id', 'test-%');
}

/**
 * Create a test user profile
 */
export async function createTestUser(data: {
    id: string;
    email: string;
    fullName: string;
    role?: 'customer' | 'admin';
    phone?: string;
}) {
    const supabase = createTestSupabaseServiceClient();

    const { data: profile, error } = await supabase
        .from('profiles')
        .insert({
            id: data.id,
            email: data.email,
            full_name: data.fullName,
            role: data.role || 'customer',
            phone: data.phone || null,
        })
        .select()
        .single();

    if (error) throw error;
    return profile;
}

/**
 * Create a test appointment
 */
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

/**
 * Check if test user exists
 */
export async function testUserExists(email: string): Promise<boolean> {
    const supabase = createTestSupabaseServiceClient();

    try {
        const { data } = await supabase.auth.admin.listUsers();
        return data?.users.some(u => u.email === email) || false;
    } catch (error) {
        console.error('Error checking if test user exists:', error);
        return false;
    }
}

/**
 * Get all services for testing
 */
export async function getTestServices() {
    const supabase = createTestSupabaseClient();

    const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

/**
 * Delete test appointments for cleanup
 */
export async function deleteTestAppointments(clientId?: string) {
    const supabase = createTestSupabaseServiceClient();

    let query = supabase.from('appointments').delete();

    if (clientId) {
        query = query.eq('client_id', clientId);
    } else {
        // Delete all test appointments (be careful!)
        query = query.ilike('client_id', 'test-%');
    }

    const { error } = await query;
    if (error) throw error;
}

