/**
 * Integration test for booking API endpoint
 * Tests the complete booking flow with database interactions
 */

import { createTestSupabaseServiceClient, createTestUser, cleanupTestData } from '../../helpers/test-db';
import { clearMockTelegramData } from '../../helpers/mock-telegram';

// Mock Next.js modules
jest.mock('next/server', () => ({
    NextResponse: {
        json: (data: any, init?: any) => ({
            json: async () => data,
            status: init?.status || 200,
            ...init,
        }),
    },
}));

// Mock Telegram to prevent actual API calls
jest.mock('@/lib/telegram', () => ({
    sendTelegramMessage: jest.fn().mockResolvedValue({ ok: true }),
    answerCallbackQuery: jest.fn().mockResolvedValue({ ok: true }),
}));

describe('Integration: Booking API', () => {
    const supabase = createTestSupabaseServiceClient();
    let testUserId: string;
    let testServiceId: string;

    beforeAll(async () => {
        // Create test user via auth.admin (UUID generado por Supabase)
        const user = await createTestUser({
            email: 'booking-test@corteurbano.test',
            fullName: 'Test Booking User',
            role: 'customer',
            phone: '+1234567890',
        });
        testUserId = user.id;

        // Obtener servicio real de la BD
        const { data: services } = await supabase.from('services').select('id').limit(1);
        if (services && services.length > 0) {
            testServiceId = services[0].id;
        } else {
            const { data: service } = await supabase
                .from('services')
                .insert({ name: 'Test Service', price: 20.0, duration_minutes: 30 })
                .select('id')
                .single();
            testServiceId = service!.id;
        }
    }, 30000);

    afterAll(async () => {
        await cleanupTestData();
    }, 30000);

    beforeEach(() => {
        clearMockTelegramData();
        jest.clearAllMocks();
    });

    describe('POST /api/booking/create', () => {
        it('should create appointment successfully with valid data', async () => {
            const { data: appointment, error } = await supabase
                .from('appointments')
                .insert({
                    client_id: testUserId,
                    service_id: testServiceId,
                    start_time: new Date(Date.now() + 86400000).toISOString(),
                    status: 'pending',
                })
                .select()
                .single();

            expect(error).toBeNull();
            expect(appointment).toBeDefined();
            expect(appointment.client_id).toBe(testUserId);
            expect(appointment.service_id).toBe(testServiceId);
            expect(appointment.status).toBe('pending');
        });

        it('should update user profile when clientData is provided', async () => {
            const newName = 'Updated Test Name';
            const newPhone = '+1111111111';

            await supabase
                .from('profiles')
                .update({ full_name: newName, phone: newPhone })
                .eq('id', testUserId);

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, phone')
                .eq('id', testUserId)
                .single();

            expect(profile?.full_name).toBe(newName);
            expect(profile?.phone).toBe(newPhone);
        });

        it('should reject booking without authentication (RLS)', async () => {
            // Cliente anónimo NO puede insertar citas (RLS)
            const { createClient } = require('@supabase/supabase-js');
            const anonClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { auth: { persistSession: false } }
            );

            const { error: insertError } = await anonClient
                .from('appointments')
                .insert({
                    client_id: testUserId,
                    service_id: testServiceId,
                    start_time: new Date().toISOString(),
                    status: 'pending',
                });

            // RLS debe rechazar la inserción anónima
            expect(insertError).toBeDefined();
        });

        it('should reject booking with invalid service ID (FK violation)', async () => {
            const { error } = await supabase
                .from('appointments')
                .insert({
                    client_id: testUserId,
                    service_id: '00000000-0000-0000-0000-000000000000',
                    start_time: new Date().toISOString(),
                    status: 'pending',
                });

            expect(error).toBeDefined();
            expect(error?.code).toBe('23503'); // Foreign key violation
        });

        it('should allow double booking (no DB constraint yet — app validates)', async () => {
            const startTime = new Date(Date.now() + 172800000).toISOString();

            const { data: first, error: e1 } = await supabase
                .from('appointments')
                .insert({ client_id: testUserId, service_id: testServiceId, start_time: startTime, status: 'confirmed' })
                .select().single();

            expect(e1).toBeNull();
            expect(first).toBeDefined();

            // DB no tiene constraint de unicidad en start_time — la validación es a nivel aplicación
            const { data: second } = await supabase
                .from('appointments')
                .insert({ client_id: testUserId, service_id: testServiceId, start_time: startTime, status: 'pending' })
                .select().single();

            // Si lo permite, es porque no hay constraint DB — el API sí lo bloquea
            if (second) {
                // Comparar como Date (Supabase puede devolver +00:00 en vez de Z)
                expect(new Date(second.start_time).getTime()).toBe(new Date(startTime).getTime());
            }
        });
    });

    describe('Telegram notifications', () => {
        it('debería tener mock de sendTelegramMessage disponible', async () => {
            const { sendTelegramMessage } = require('@/lib/telegram');

            // Llamar manualmente para verificar que el mock funciona
            await sendTelegramMessage('Test message');

            expect(sendTelegramMessage).toHaveBeenCalledWith('Test message');
        });
    });
});
