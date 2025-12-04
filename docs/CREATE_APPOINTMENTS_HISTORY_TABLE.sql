-- Crear tabla de historial de citas para estadísticas
CREATE TABLE IF NOT EXISTS appointments_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    original_appointment_id UUID NOT NULL,
    client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('completed', 'cancelled')),
    cancellation_reason TEXT,
    archived_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL,
    
    -- Datos del servicio al momento del archivo (para estadísticas)
    service_name TEXT NOT NULL,
    service_price DECIMAL(10,2) NOT NULL,
    service_duration_minutes INTEGER NOT NULL,
    
    -- Datos del cliente al momento del archivo
    client_name TEXT,
    client_phone TEXT,
    client_email TEXT
);

-- Índices para mejorar consultas de estadísticas
CREATE INDEX IF NOT EXISTS idx_appointments_history_client ON appointments_history(client_id);
CREATE INDEX IF NOT EXISTS idx_appointments_history_service ON appointments_history(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_history_status ON appointments_history(status);
CREATE INDEX IF NOT EXISTS idx_appointments_history_archived_at ON appointments_history(archived_at);
CREATE INDEX IF NOT EXISTS idx_appointments_history_start_time ON appointments_history(start_time);

-- RLS Policies
ALTER TABLE appointments_history ENABLE ROW LEVEL SECURITY;

-- Admin puede ver todo el historial
CREATE POLICY "Admin can view all history"
    ON appointments_history
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Admin puede insertar en el historial
CREATE POLICY "Admin can insert history"
    ON appointments_history
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Clientes pueden ver su propio historial
CREATE POLICY "Users can view own history"
    ON appointments_history
    FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

COMMENT ON TABLE appointments_history IS 'Historial de citas archivadas para mantener estadísticas y reportes';
