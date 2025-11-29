'use client';

import { useState, useMemo } from 'react';
import { AppointmentsTable, type Appointment } from './AppointmentsTable';
import { AppointmentsFilters } from './AppointmentsFilters';
import { useToast } from '@/components/ui/toast';

type AppointmentsListProps = {
  initialAppointments: Appointment[];
};

export function AppointmentsList({ initialAppointments }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();

  const filteredAppointments = useMemo(() => {
    let filtered = [...appointments];

    // Filtro por fecha
    if (selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      filtered = filtered.filter((apt) => apt.start_time.startsWith(dateStr));
    }

    // Filtro por estado
    if (selectedStatus !== 'all') {
      filtered = filtered.filter((apt) => apt.status === selectedStatus);
    }

    return filtered;
  }, [appointments, selectedDate, selectedStatus]);

  async function handleStatusChange(id: string, newStatus: 'confirmed' | 'cancelled') {
    setLoading(true);
    try {
      const response = await fetch('/api/appointments/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentId: id, status: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar el estado');
      }

      // Actualizar estado local
      setAppointments((prev) =>
        prev.map((apt) => (apt.id === id ? { ...apt, status: newStatus } : apt))
      );

      showToast(
        newStatus === 'confirmed' ? 'Cita confirmada exitosamente' : 'Cita cancelada',
        'success'
      );
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al actualizar el estado', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {ToastComponent}
      <div className="space-y-4">
        <AppointmentsFilters
          onDateFilter={setSelectedDate}
          onStatusFilter={setSelectedStatus}
          selectedDate={selectedDate}
          selectedStatus={selectedStatus}
        />
        <AppointmentsTable
          appointments={filteredAppointments}
          onStatusChange={handleStatusChange}
          loading={loading}
        />
      </div>
    </>
  );
}

