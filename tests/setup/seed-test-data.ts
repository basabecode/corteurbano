/**
 * Seed Test Data Script
 * Creates test users and initial data for E2E tests
 * Run this before executing E2E tests
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '../../.env.test') });

const supabaseUrl = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.TEST_SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase credentials in .env.test');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedTestUsers() {
    console.log('🌱 Seeding test users...');

    const testUsers = [
        {
            email: 'customer@test.com',
            password: 'test-password-123',
            fullName: 'Test Customer',
            role: 'customer' as const,
            phone: '+1234567890'
        },
        {
            email: 'admin@test.com',
            password: 'admin-password-123',
            fullName: 'Test Admin',
            role: 'admin' as const,
            phone: '+0987654321'
        }
    ];

    for (const user of testUsers) {
        try {
            // Check if user already exists
            const { data: existingUser } = await supabase.auth.admin.listUsers();
            const userExists = existingUser?.users.some(u => u.email === user.email);

            if (userExists) {
                console.log(`✓ User ${user.email} already exists`);
                continue;
            }

            // Create auth user with email confirmation bypassed
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true, // Bypass email confirmation
                user_metadata: {
                    full_name: user.fullName
                }
            });

            if (authError) {
                console.error(`❌ Error creating auth user ${user.email}:`, authError.message);
                continue;
            }

            console.log(`✓ Created auth user: ${user.email}`);

            // Update profile with additional data
            const { error: profileError } = await supabase
                .from('profiles')
                .update({
                    full_name: user.fullName,
                    role: user.role,
                    phone: user.phone
                })
                .eq('id', authData.user.id);

            if (profileError) {
                console.error(`❌ Error updating profile for ${user.email}:`, profileError.message);
            } else {
                console.log(`✓ Updated profile for: ${user.email}`);
            }

        } catch (error) {
            console.error(`❌ Unexpected error creating user ${user.email}:`, error);
        }
    }
}

async function seedTestServices() {
    console.log('\n🌱 Checking test services...');

    try {
        // Check if services exist
        const { data: services, error } = await supabase
            .from('services')
            .select('*');

        if (error) {
            console.error('❌ Error fetching services:', error.message);
            return;
        }

        if (services && services.length > 0) {
            console.log(`✓ Found ${services.length} existing services`);
            return;
        }

        // Create default services if none exist
        const defaultServices = [
            {
                name: 'Corte de Cabello',
                description: 'Corte de cabello profesional',
                duration_minutes: 30,
                price: 15000
            },
            {
                name: 'Barba',
                description: 'Arreglo de barba',
                duration_minutes: 20,
                price: 10000
            },
            {
                name: 'Corte + Barba',
                description: 'Combo completo',
                duration_minutes: 45,
                price: 22000
            }
        ];

        const { error: insertError } = await supabase
            .from('services')
            .insert(defaultServices);

        if (insertError) {
            console.error('❌ Error creating services:', insertError.message);
        } else {
            console.log(`✓ Created ${defaultServices.length} test services`);
        }

    } catch (error) {
        console.error('❌ Unexpected error seeding services:', error);
    }
}

async function cleanupOldTestData() {
    console.log('\n🧹 Cleaning up old test appointments...');

    try {
        // Delete old test appointments (older than 1 day)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        const { error } = await supabase
            .from('appointments')
            .delete()
            .lt('created_at', oneDayAgo.toISOString())
            .or('status.eq.cancelled,status.eq.completed');

        if (error) {
            console.error('❌ Error cleaning up appointments:', error.message);
        } else {
            console.log('✓ Cleaned up old test appointments');
        }

    } catch (error) {
        console.error('❌ Unexpected error during cleanup:', error);
    }
}

async function main() {
    console.log('🚀 Starting test data seeding...\n');

    try {
        await seedTestUsers();
        await seedTestServices();
        await cleanupOldTestData();

        console.log('\n✅ Test data seeding completed successfully!');
        console.log('\nTest users created:');
        console.log('  - customer@test.com / test-password-123');
        console.log('  - admin@test.com / admin-password-123');
        console.log('\nYou can now run E2E tests with: pnpm test:e2e\n');

    } catch (error) {
        console.error('\n❌ Fatal error during seeding:', error);
        process.exit(1);
    }
}

// Run the seeding
main();
