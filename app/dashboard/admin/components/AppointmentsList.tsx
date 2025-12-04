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

  // Estados para acciones separadas
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

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

  // Identificar qué tipo de citas están seleccionadas
  const selectedIds = Array.from(selectedAppointments);
  const selectedCompleted = selectedIds.filter(id =>
    appointments.find(a => a.id === id)?.status === 'completed'
  );
  const selectedCancelled = selectedIds.filter(id =>
    appointments.find(a => a.id === id)?.status === 'cancelled'
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
    if (selectedAppointments.size === cleanableAppointments.length) {
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

  async function handleArchive() {
    if (selectedCompleted.length === 0) return;

    setArchiveLoading(true);
    try {
      const response = await fetch('/api/admin/archive-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentIds: selectedCompleted })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al archivar las citas');
      }

      const result = await response.json();

      // Actualizar estado local
      setAppointments(prev =>
        prev.filter(apt => !selectedCompleted.includes(apt.id))
      );

      // Limpiar selección de las archivadas
      setSelectedAppointments(prev => {
        const newSet = new Set(prev);
        selectedCompleted.forEach(id => newSet.delete(id));
        return newSet;
      });

      showToast(result.message || 'Citas archivadas exitosamente', 'success');
      setShowArchiveModal(false);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al archivar las citas', 'error');
    } finally {
      setArchiveLoading(false);
    }
  }

  async function handleDelete() {
    if (selectedCancelled.length === 0) return;

    setDeleteLoading(true);
    try {
      const response = await fetch('/api/admin/delete-appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ appointmentIds: selectedCancelled })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar las citas');
      }

      const result = await response.json();

      // Actualizar estado local
      setAppointments(prev =>
        prev.filter(apt => !selectedCancelled.includes(apt.id))
      );

      // Limpiar selección de las eliminadas
      setSelectedAppointments(prev => {
        const newSet = new Set(prev);
        selectedCancelled.forEach(id => newSet.delete(id));
        return newSet;
      });

      showToast(result.message || 'Citas eliminadas permanentemente', 'success');
      setShowDeleteModal(false);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar las citas', 'error');
    } finally {
      setDeleteLoading(false);
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

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {cleanableAppointments.length > 0 && (
              <>
                <Button
                  onClick={toggleSelectAll}
                  variant="outline"
                  size="default"
                  className="border-slate-700 text-slate-300 hover:bg-slate-800 w-full sm:w-auto"
                >
                  {selectedAppointments.size === cleanableAppointments.length ? (
                    <><CheckSquare className="h-5 w-5 mr-2" /> Deseleccionar todas</>
                  ) : (
                    <><Square className="h-5 w-5 mr-2" /> Seleccionar todas</>
                  )}
                </Button>

                {/* Botón Archivar (Completadas) */}
                <Button
                  onClick={() => setShowArchiveModal(true)}
                  variant="outline"
                  size="default"
                  disabled={selectedCompleted.length === 0}
                  className="border-blue-700 text-blue-400 hover:bg-blue-900/20 disabled:opacity-50 w-full sm:w-auto"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Archivar ({selectedCompleted.length})
                </Button>

                {/* Botón Eliminar (Canceladas) */}
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="outline"
                  size="default"
                  disabled={selectedCancelled.length === 0}
                  className="border-rose-700 text-rose-400 hover:bg-rose-900/20 disabled:opacity-50 w-full sm:w-auto"
                >
                  <Trash2 className="h-5 w-5 mr-2" />
                  Eliminar ({selectedCancelled.length})
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

      {/* Modal de Archivar (Completadas) */}
      <Modal
        isOpen={showArchiveModal}
        onClose={() => !archiveLoading && setShowArchiveModal(false)}
        title="Archivar citas completadas"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowArchiveModal(false)}
              disabled={archiveLoading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleArchive}
              disabled={archiveLoading}
              className="flex-1 bg-blue-600 text-white hover:bg-blue-700"
            >
              {archiveLoading ? 'Archivando...' : 'Sí, archivar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Estás seguro de que deseas archivar {selectedCompleted.length} cita(s) completada(s)?
          </p>
          <p className="text-sm text-slate-400">
            Las citas archivadas se moverán al historial para fines estadísticos y desaparecerán de esta lista.
          </p>
        </div>
      </Modal>

      {/* Modal de Eliminar (Canceladas) */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => !deleteLoading && setShowDeleteModal(false)}
        title="Eliminar citas canceladas"
        size="md"
        footer={
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={deleteLoading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="flex-1 bg-rose-500 text-white hover:bg-rose-600"
            >
              {deleteLoading ? 'Eliminando...' : 'Sí, eliminar'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Estás seguro de que deseas eliminar permanentemente {selectedCancelled.length} cita(s) cancelada(s)?
          </p>

          <div className="rounded-lg border border-amber-800 bg-amber-900/20 p-4">
            <p className="text-sm text-amber-200">
              ⚠️ <strong>Advertencia:</strong> Esta acción no se puede deshacer. Las citas serán eliminadas permanentemente de la base de datos y no se guardarán en el historial.
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}
