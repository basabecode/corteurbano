import { z } from 'zod';

export const createBookingSchema = z.object({
  serviceId: z.string().uuid(),
  start: z.string().datetime()
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;







