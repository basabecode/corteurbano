'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Scissors, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatCOP } from '@/lib/format-currency';
import { useRouter } from 'next/navigation';

type Service = {
  id: string;
  name: string;
  price: number;
  duration_minutes: number;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  slug: string | null;
};

type FormData = {
  name: string;
  price: string;
  duration_minutes: string;
  description: string;
  image_url: string;
};

const emptyForm: FormData = { name: '', price: '', duration_minutes: '', description: '', image_url: '' };

export function ServiciosContent({ initialServices }: { initialServices: Service[] }) {
  const [services, setServices] = useState<Service[]>(initialServices);
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Service | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  function openCreate() {
    setEditingService(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEdit(service: Service) {
    setEditingService(service);
    setFormData({
      name: service.name,
      price: service.price.toString(),
      duration_minutes: service.duration_minutes.toString(),
      description: service.description || '',
      image_url: service.image_url || '',
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim() || !formData.price || !formData.duration_minutes) {
      showToast('Nombre, precio y duración son obligatorios', 'error');
      return;
    }

    const price = parseFloat(formData.price);
    const duration = parseInt(formData.duration_minutes);

    if (isNaN(price) || price <= 0) { showToast('El precio debe ser un número positivo', 'error'); return; }
    if (isNaN(duration) || duration <= 0) { showToast('La duración debe ser un número positivo', 'error'); return; }

    setFormLoading(true);
    try {
      const body = {
        name: formData.name.trim(),
        price,
        duration_minutes: duration,
        description: formData.description.trim() || undefined,
        image_url: formData.image_url.trim() || undefined,
      };

      let res: Response;
      if (editingService) {
        res = await fetch(`/api/admin/services/${editingService.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/admin/services', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      showToast(editingService ? 'Servicio actualizado' : 'Servicio creado', 'success');
      setShowForm(false);
      router.refresh();

      // Actualizar lista localmente
      const data = await res.json();
      if (editingService) {
        setServices(prev => prev.map(s => s.id === editingService.id ? data.service : s));
      } else {
        setServices(prev => [...prev, data.service]);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(service: Service) {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Error al cambiar estado');
      const data = await res.json();
      setServices(prev => prev.map(s => s.id === service.id ? data.service : s));
      showToast(data.service.is_active ? 'Servicio activado' : 'Servicio desactivado', 'success');
    } catch {
      showToast('Error al cambiar el estado', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/services/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      setServices(prev => prev.filter(s => s.id !== deleteTarget.id));
      showToast('Servicio eliminado', 'success');
      setDeleteTarget(null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al eliminar', 'error');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      {ToastComponent}

      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-sm">{services.length} servicio(s) registrado(s)</p>
        <Button onClick={openCreate} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Servicio
        </Button>
      </div>

      {/* Lista */}
      {services.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/40">
          <Scissors className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No hay servicios creados aún</p>
          <Button onClick={openCreate} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            Crear primer servicio
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service.id}
              className={cn(
                'rounded-xl border p-4 md:p-5 transition-colors',
                service.is_active
                  ? 'border-slate-800 bg-slate-900/40'
                  : 'border-slate-800/50 bg-slate-900/20 opacity-60'
              )}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-base font-semibold text-slate-100">{service.name}</h3>
                    <span className={cn(
                      'rounded-full border px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide',
                      service.is_active
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-600/30 bg-slate-700/20 text-slate-500'
                    )}>
                      {service.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                    <span className="font-medium text-amber-400">{formatCOP(service.price)}</span>
                    <span>{service.duration_minutes} min</span>
                    {service.description && (
                      <span className="hidden md:block truncate max-w-xs text-slate-500">
                        {service.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    onClick={() => handleToggle(service)}
                    variant="outline"
                    size="sm"
                    className={cn(
                      'border-slate-700 text-slate-300 hover:bg-slate-800',
                      service.is_active ? 'hover:text-amber-400' : 'hover:text-emerald-400'
                    )}
                  >
                    {service.is_active
                      ? <><ToggleRight className="h-4 w-4 mr-1.5" /> Desactivar</>
                      : <><ToggleLeft className="h-4 w-4 mr-1.5" /> Activar</>
                    }
                  </Button>
                  <Button
                    onClick={() => openEdit(service)}
                    variant="outline"
                    size="sm"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-amber-400"
                  >
                    <Edit2 className="h-4 w-4 mr-1.5" /> Editar
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(service)}
                    variant="outline"
                    size="sm"
                    className="border-rose-900/50 text-rose-400 hover:bg-rose-900/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => !formLoading && setShowForm(false)}
        title={editingService ? 'Editar Servicio' : 'Nuevo Servicio'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={formLoading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={formLoading}
              className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400">
              {formLoading ? 'Guardando...' : editingService ? 'Actualizar' : 'Crear'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Nombre <span className="text-rose-400">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="Corte Clásico"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Precio (COP) <span className="text-rose-400">*</span></label>
              <input
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                placeholder="50000"
                min="0"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Duración (min) <span className="text-rose-400">*</span></label>
              <input
                type="number"
                value={formData.duration_minutes}
                onChange={e => setFormData({ ...formData, duration_minutes: e.target.value })}
                placeholder="45"
                min="1"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Descripción <span className="text-slate-500">(opcional)</span></label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe el servicio en detalle..."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">URL de imagen <span className="text-slate-500">(opcional)</span></label>
            <input
              type="text"
              value={formData.image_url}
              onChange={e => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        title="Eliminar Servicio"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Eliminar el servicio <strong className="text-slate-100">"{deleteTarget?.name}"</strong>?
          </p>
          <div className="rounded-lg border border-rose-900/50 bg-rose-900/20 p-3">
            <p className="text-sm text-rose-200">
              Solo se puede eliminar si no tiene citas activas. Si las tiene, desactívalo primero.
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleteLoading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800">
              Cancelar
            </Button>
            <Button onClick={handleDelete} disabled={deleteLoading}
              className="flex-1 bg-rose-600 text-white hover:bg-rose-700">
              {deleteLoading ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
