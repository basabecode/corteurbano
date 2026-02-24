/**
 * Tests de validación para el campo barberId (nueva feature)
 */
import { createBookingSchema } from '@/lib/validation';

describe('Validation - createBookingSchema con barberId', () => {
    const base = {
        serviceId: '550e8400-e29b-41d4-a716-446655440000',
        start: '2025-12-15T10:00:00Z',
    };

    it('debería aceptar booking sin barberId (campo opcional)', () => {
        const result = createBookingSchema.safeParse(base);
        expect(result.success).toBe(true);
    });

    it('debería aceptar booking con barberId UUID válido', () => {
        const data = { ...base, barberId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' };
        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.barberId).toBe('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
        }
    });

    it('debería rechazar barberId que no es UUID', () => {
        const data = { ...base, barberId: 'carlos' };
        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('debería rechazar barberId con formato incorrecto', () => {
        const data = { ...base, barberId: '123-456' };
        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(false);
    });

    it('debería aceptar barberId undefined explícito', () => {
        const data = { ...base, barberId: undefined };
        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
    });

    it('debería aceptar booking completo con barberId + clientData', () => {
        const data = {
            ...base,
            barberId: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
            clientData: { fullName: 'Juan Pérez', phone: '3001234567' },
        };
        const result = createBookingSchema.safeParse(data);
        expect(result.success).toBe(true);
    });
});
