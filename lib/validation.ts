import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId:     z.string().uuid(),
  start:         z.string().datetime(),
  barberId:      z.string().uuid().optional(),
  bookingType:   z.enum(['presencial', 'domicilio']).default('presencial'),
  clientAddress: z.string().min(10, 'La dirección debe tener al menos 10 caracteres').optional(),
  clientData:    z.object({
    fullName: z.string().min(3, 'El nombre es muy corto'),
    phone:    z.string().min(8, 'El teléfono es inválido')
  }).optional()
}).refine(
  data => data.bookingType !== 'domicilio' || !!data.clientAddress,
  { message: 'La dirección es requerida para servicio a domicilio', path: ['clientAddress'] }
);

export type CreateBookingInput = z.infer<typeof createBookingSchema>;







