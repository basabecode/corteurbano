import { createBookingSchema } from '@/lib/validation';

describe('Validation - createBookingSchema', () => {
    describe('Valid inputs', () => {
        it('should accept valid booking data', () => {
            const validData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'John Doe',
                    phone: '12345678',
                },
            };

            const result = createBookingSchema.safeParse(validData);
            expect(result.success).toBe(true);
            if (result.success) {
                // bookingType defaults to 'presencial' when not provided
                expect(result.data).toEqual({ ...validData, bookingType: 'presencial' });
            }
        });

        it('should accept booking without clientData', () => {
            const validData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
            };

            const result = createBookingSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('Invalid serviceId', () => {
        it('should reject non-UUID serviceId', () => {
            const invalidData = {
                serviceId: 'not-a-uuid',
                start: '2025-12-15T10:00:00Z',
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('serviceId');
            }
        });

        it('should reject empty serviceId', () => {
            const invalidData = {
                serviceId: '',
                start: '2025-12-15T10:00:00Z',
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Invalid start time', () => {
        it('should reject non-datetime start', () => {
            const invalidData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: 'not-a-datetime',
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('start');
            }
        });

        it('should reject invalid ISO date format', () => {
            const invalidData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15 10:00:00', // Missing 'T' and 'Z'
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Invalid clientData', () => {
        it('should reject fullName shorter than 3 characters', () => {
            const invalidData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'Jo', // Too short
                    phone: '12345678',
                },
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('nombre es muy corto');
            }
        });

        it('should reject phone shorter than 8 characters', () => {
            const invalidData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'John Doe',
                    phone: '1234567', // Too short
                },
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('teléfono es inválido');
            }
        });

        it('should reject clientData with missing fullName', () => {
            const invalidData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    phone: '12345678',
                },
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should reject clientData with missing phone', () => {
            const invalidData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'John Doe',
                },
            };

            const result = createBookingSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });
    });

    describe('Edge cases', () => {
        it('should accept minimum valid fullName (3 characters)', () => {
            const validData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'Joe',
                    phone: '12345678',
                },
            };

            const result = createBookingSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept minimum valid phone (8 characters)', () => {
            const validData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'John Doe',
                    phone: '12345678',
                },
            };

            const result = createBookingSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should accept long fullName', () => {
            const validData = {
                serviceId: '550e8400-e29b-41d4-a716-446655440000',
                start: '2025-12-15T10:00:00Z',
                clientData: {
                    fullName: 'A'.repeat(100),
                    phone: '12345678',
                },
            };

            const result = createBookingSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });
});
