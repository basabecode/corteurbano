-- Agregar campo de motivo de cancelación solo a appointments
-- (appointments_history se creará después)

ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS cancellation_reason text;

COMMENT ON COLUMN public.appointments.cancellation_reason IS 
'Motivo por el cual se canceló la cita (opcional)';
