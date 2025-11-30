/**
 * Test authentication helpers
 * Utilities for creating authenticated test contexts
 */

import { createTestSupabaseServiceClient } from './test-db';

/**
 * Create a mock authenticated user session
 */
export function createMockSession(userId: string, email: string) {
    return {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: {
            id: userId,
            email,
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        },
    };
}

/**
 * Create mock request headers with authentication
 */
export function createAuthHeaders(accessToken: string = 'mock-access-token') {
    return {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
    };
}

/**
 * Sign in a test user and get session
 */
export async function signInTestUser(email: string, password: string = 'test-password-123') {
    const supabase = createTestSupabaseServiceClient();

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    return data;
}

/**
 * Create a test user with auth credentials
 */
export async function createTestUserWithAuth(data: {
    email: string;
    password: string;
    fullName: string;
    role?: 'customer' | 'admin';
}) {
    const supabase = createTestSupabaseServiceClient();

    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password: data.password,
        email_confirm: true,
    });

    if (authError) throw authError;

    // Update profile
    const { error: profileError } = await supabase
        .from('profiles')
        .update({
            full_name: data.fullName,
            role: data.role || 'customer',
        })
        .eq('id', authData.user.id);

    if (profileError) throw profileError;

    return authData.user;
}

/**
 * Ensure test user exists, create if not
 */
export async function ensureTestUserExists(email: string, password: string, fullName: string, role: 'customer' | 'admin' = 'customer') {
    const supabase = createTestSupabaseServiceClient();

    try {
        // Try to sign in first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (!signInError && signInData.user) {
            return signInData.user;
        }

        // User doesn't exist, create it
        return await createTestUserWithAuth({
            email,
            password,
            fullName,
            role,
        });
    } catch (error) {
        console.error(`Error ensuring test user ${email} exists:`, error);
        throw error;
    }
}

