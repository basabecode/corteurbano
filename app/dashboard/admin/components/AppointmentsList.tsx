'use client';

import { useState, useMemo, useEffect } from 'react';
import { AppointmentsTable, type Appointment } from './AppointmentsTable';
import { AppointmentsFilters } from './AppointmentsFilters';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Trash2, CheckSquare, Square } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

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
  const [selectedAppointments, setSelectedAppointments] = useState<Set<string>>(new Set());
  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  // Actualización en tiempo real
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const channel = supabase
      .channel('admin-appointments-changes')
      .on(
        'postgres_changes',
        {
          event: '*', // Escuchar INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments'
        },
        (payload) => {
          console.log('Cambio detectado en citas (Admin):', payload);
          router.refresh(); // Recargar datos del servidor
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  // Sincronizar estado local con props iniciales cuando cambian (por el router.refresh)
  useEffect(() => {
    setAppointments(initialAppointments);
  }, [initialAppointments]);

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

  // Citas que se pueden eliminar (canceladas o completadas)
  const cleanableAppointments = appointments.filter(
    apt => apt.status === 'cancelled' || apt.status === 'completed'
  );

  // Citas seleccionadas que son eliminables
  const selectedCleanableAppointments = Array.from(selectedAppointments).filter(id =>
    cleanableAppointments.some(apt => apt.id === id)
  );

  function toggleAppointmentSelection(id: string) {
    setSelectedAppointments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function toggleSelectAll() {
    if (selectedCleanableAppointments.length === cleanableAppointments.length) {
      // Deseleccionar todas
      setSelectedAppointments(new Set());
    } else {
      // Seleccionar todas las eliminables
      setSelectedAppointments(new Set(cleanableAppointments.map(apt => apt.id)));
    }
  }

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
    if (selectedCleanableAppointments.length === 0) {
      showToast('Selecciona al menos una cita para eliminar', 'error');
      return;
    }

    setCleanupLoading(true);
    try {
      const response = await fetch('/api/appointments/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentIds: selectedCleanableAppointments })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar las citas');
      }

      const result = await response.json();

      // Actualizar estado local eliminando las citas
      setAppointments(prev =>
        prev.filter(apt => !selectedCleanableAppointments.includes(apt.id))
      );

      // Limpiar selección
      setSelectedAppointments(new Set());

      showToast(result.message || 'Citas eliminadas exitosamente', 'success');
      setShowCleanupModal(false);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar las citas', 'error');
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

          <div className="flex gap-2">
            {cleanableAppointments.length > 0 && (
              <>
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="sm"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  {selectedCleanableAppointments.length === cleanableAppointments.length ? (
                    <><CheckSquare className="h-4 w-4 mr-2" /> Deseleccionar todas</>
                  ) : (
                    <><Square className="h-4 w-4 mr-2" /> Seleccionar todas</>
                  )}
                </Button>
                <Button
                  onClick={() => setShowCleanupModal(true)}
                  variant="outline"
                  disabled={selectedCleanableAppointments.length === 0}
                  className="border-rose-700 text-rose-400 hover:bg-rose-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar seleccionadas ({selectedCleanableAppointments.length})
                </Button>
              </>
            )}
          </div>
        </div>

        <AppointmentsTable
          appointments={filteredAppointments}
          onStatusChange={handleStatusChange}
          loading={loading}
          selectedAppointments={selectedAppointments}
          onToggleSelection={toggleAppointmentSelection}
          cleanableAppointments={cleanableAppointments}
        />
      </div>

      {/* Modal de confirmación de limpieza */}
      <Modal
        isOpen={showCleanupModal}
        onClose={() => !cleanupLoading && setShowCleanupModal(false)}
        title="Eliminar citas seleccionadas"
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
            ¿Estás seguro de que deseas eliminar permanentemente las citas seleccionadas?
          </p>

          <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Citas a eliminar:</span>
              <span className="font-semibold text-slate-100">
                {selectedCleanableAppointments.length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Canceladas:</span>
              <span className="font-semibold text-rose-400">
                {appointments.filter(apt => selectedCleanableAppointments.includes(apt.id) && apt.status === 'cancelled').length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Completadas:</span>
              <span className="font-semibold text-emerald-400">
                {appointments.filter(apt => selectedCleanableAppointments.includes(apt.id) && apt.status === 'completed').length}
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
