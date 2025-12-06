-- ========================================
-- TABLA DE HISTORIAL DE CITAS ARCHIVADAS
-- ========================================
-- Esta tabla almacena las citas completadas que el cliente archiva
-- Permite al cliente revisar su historial de cortes

CREATE TABLE IF NOT EXISTS archived_appointments (
    -- Información copiada de la cita original
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    original_appointment_id UUID NOT NULL, -- ID de la cita original antes de archivar
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id),
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed',
    cancellation_reason TEXT,
    
    -- Información del servicio (guardada para mantener historial)
    service_name TEXT NOT NULL,
    service_price NUMERIC(10, 2) NOT NULL,
    service_duration_minutes INTEGER NOT NULL,
    
    -- Metadatos
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL, -- Fecha original de creación
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_archived_appointments_client_id ON archived_appointments(client_id);
CREATE INDEX IF NOT EXISTS idx_archived_appointments_start_time ON archived_appointments(start_time);
CREATE INDEX IF NOT EXISTS idx_archived_appointments_archived_at ON archived_appointments(archived_at);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Habilitar RLS
ALTER TABLE archived_appointments ENABLE ROW LEVEL SECURITY;

-- Política: Los clientes solo pueden ver sus propias citas archivadas
CREATE POLICY "Los clientes pueden ver sus propias citas archivadas"
    ON archived_appointments
    FOR SELECT
    USING (auth.uid() = client_id);

-- Política: Los administradores pueden ver todas las citas archivadas
CREATE POLICY "Los administradores pueden ver todas las citas archivadas"
    ON archived_appointments
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Política: Solo el sistema puede insertar (a través de API)
-- (Evitamos que usuarios inserten directamente)

-- ========================================
-- COMENTARIOS
-- ========================================
COMMENT ON TABLE archived_appointments IS 'Historial de citas completadas archivadas por los clientes';
COMMENT ON COLUMN archived_appointments.original_appointment_id IS 'ID de la cita original antes de ser archivada';
COMMENT ON COLUMN archived_appointments.service_name IS 'Nombre del servicio guardado en el momento del archivo';
COMMENT ON COLUMN archived_appointments.service_price IS 'Precio del servicio guardado en el momento del archivo';
COMMENT ON COLUMN archived_appointments.archived_at IS 'Fecha y hora en que se archivó la cita';
