-- Extensiones para barbers: soporte de ubicación y servicio a domicilio
ALTER TABLE public.barbers
  ADD COLUMN IF NOT EXISTS lat              DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS lng              DECIMAL(9,6),
  ADD COLUMN IF NOT EXISTS address_label    TEXT,
  ADD COLUMN IF NOT EXISTS offers_domicilio BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_barbers_domicilio ON public.barbers(offers_domicilio) WHERE is_active = true;

-- Extensiones para appointments: tipo de reserva y dirección del cliente
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS booking_type   TEXT NOT NULL DEFAULT 'presencial'
    CHECK (booking_type IN ('presencial', 'domicilio')),
  ADD COLUMN IF NOT EXISTS client_address TEXT;

CREATE INDEX IF NOT EXISTS idx_appointments_booking_type ON public.appointments(booking_type);
