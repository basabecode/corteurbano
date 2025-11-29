import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  start: z.string().datetime(),
  clientData: z.object({
    fullName: z.string().min(3, 'El nombre es muy corto'),
    phone: z.string().min(8, 'El teléfono es inválido')
  }).optional()
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;







