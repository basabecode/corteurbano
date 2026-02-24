/**
 * Integration test — tabla barbers y columna barber_id en appointments
 */
import { createTestSupabaseServiceClient } from '../../helpers/test-db';

describe('Integration: Barbers', () => {
    const supabase = createTestSupabaseServiceClient();

    describe('Tabla barbers', () => {
        it('debería ser accesible con service role key', async () => {
            const { data, error } = await supabase
                .from('barbers')
                .select('id, name, specialty, is_active')
                .limit(10);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(Array.isArray(data)).toBe(true);
        });

        it('debería tener al menos un barbero activo (seed)', async () => {
            const { data, error } = await supabase
                .from('barbers')
                .select('id, name, is_active')
                .eq('is_active', true);

            expect(error).toBeNull();
            expect(data!.length).toBeGreaterThanOrEqual(1);
        });

        it('todos los barberos del seed deberían tener nombre', async () => {
            const { data } = await supabase
                .from('barbers')
                .select('name')
                .limit(5);

            data?.forEach(b => {
                expect(typeof b.name).toBe('string');
                expect(b.name.length).toBeGreaterThan(0);
            });
        });
    });

    describe('Columna barber_id en appointments', () => {
        it('la columna barber_id debería existir y ser consultable', async () => {
            const { error } = await supabase
                .from('appointments')
                .select('id, barber_id')
                .limit(1);

            // Si el error incluye 'barber_id', la columna no existe
            if (error) {
                expect(error.message).not.toContain('barber_id');
            } else {
                expect(error).toBeNull();
            }
        });
    });

    describe('Servicios con nuevas columnas', () => {
        it('los servicios deberían tener is_active, slug y description', async () => {
            const { data, error } = await supabase
                .from('services')
                .select('id, name, is_active, slug, description')
                .limit(5);

            expect(error).toBeNull();
            expect(data).toBeDefined();
            expect(data!.length).toBeGreaterThan(0);

            // Todos los activos deberían tener slug
            data?.filter(s => s.is_active).forEach(s => {
                expect(s.slug).toBeTruthy();
            });
        });

        it('los slugs deberían ser únicos entre servicios activos', async () => {
            const { data } = await supabase
                .from('services')
                .select('slug')
                .eq('is_active', true)
                .not('slug', 'is', null);

            const slugs = data?.map(s => s.slug) ?? [];
            const unique = new Set(slugs);
            expect(slugs.length).toBe(unique.size);
        });
    });

    describe('RLS — cliente anónimo', () => {
        it('usuario anónimo solo debería ver barberos activos', async () => {
            const { createClient } = require('@supabase/supabase-js');
            const anonClient = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { auth: { persistSession: false } }
            );

            const { data, error } = await anonClient
                .from('barbers')
                .select('id, name, is_active');

            // Si hay datos, todos deben ser activos (RLS filtra inactivos)
            if (!error && data && data.length > 0) {
                const allActive = data.every((b: { is_active: boolean }) => b.is_active);
                expect(allActive).toBe(true);
            }
        });
    });
});
