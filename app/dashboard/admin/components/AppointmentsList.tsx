'use client';

import { useState, useMemo } from 'react';
import { AppointmentsTable, type Appointment } from './AppointmentsTable';
import { AppointmentsFilters } from './AppointmentsFilters';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

type AppointmentsListProps = {
  initialAppointments: Appointment[];
};

export function AppointmentsList({ initialAppointments }: AppointmentsListProps) {
  const [appointments, setAppointments] = useState(initialAppointments);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

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

  // Contar citas canceladas y completadas
  const cleanableAppointments = appointments.filter(
    apt => apt.status === 'cancelled' || apt.status === 'completed'
  );

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

  async function handleCleanup() {
    if (cleanableAppointments.length === 0) return;

    setCleanupLoading(true);
    try {
      const appointmentIds = cleanableAppointments.map(apt => apt.id);

      const response = await fetch('/api/appointments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentIds })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al limpiar las citas');
      }

      const result = await response.json();

      // Actualizar estado local eliminando las citas
      setAppointments(prev =>
        prev.filter(apt => apt.status !== 'cancelled' && apt.status !== 'completed')
      );

      showToast(result.message || 'Citas eliminadas exitosamente', 'success');
      setShowCleanupModal(false);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al limpiar las citas', 'error');
    } finally {
      setCleanupLoading(false);
    }
  }

  return (
    <>
      {ToastComponent}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <AppointmentsFilters
            onDateFilter={setSelectedDate}
            onStatusFilter={setSelectedStatus}
            selectedDate={selectedDate}
            selectedStatus={selectedStatus}
          />

          {cleanableAppointments.length > 0 && (
            <Button
              onClick={() => setShowCleanupModal(true)}
              variant="outline"
              className="border-rose-700 text-rose-400 hover:bg-rose-900/20"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpiar historial ({cleanableAppointments.length})
            </Button>
          )}
        </div>

        <AppointmentsTable
          appointments={filteredAppointments}
          onStatusChange={handleStatusChange}
          loading={loading}
        />
      </div>

      {/* Modal de confirmación de limpieza */}
      <Modal
        isOpen={showCleanupModal}
        onClose={() => !cleanupLoading && setShowCleanupModal(false)}
        title="Limpiar historial de citas"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCleanupModal(false)}
              disabled={cleanupLoading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCleanup}
              disabled={cleanupLoading}
              className="flex-1 bg-rose-500 text-white hover:bg-rose-600"
            >
              {cleanupLoading ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Estás seguro de que deseas eliminar permanentemente todas las citas canceladas y completadas?
          </p>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Citas a eliminar:</span>
              <span className="font-semibold text-slate-100">
                {cleanableAppointments.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Canceladas:</span>
              <span className="font-semibold text-rose-400">
                {cleanableAppointments.filter(apt => apt.status === 'cancelled').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completadas:</span>
              <span className="font-semibold text-emerald-400">
                {cleanableAppointments.filter(apt => apt.status === 'completed').length}
              </span>
            </div>
          </div>

          <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-4">
            <p className="text-sm text-amber-200">
              ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. Las citas serán eliminadas permanentemente de la base de datos.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

