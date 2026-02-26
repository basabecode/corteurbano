'use client';

import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, User, Instagram } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

type Barber = {
  id: string;
  name: string;
  specialty: string | null;
  bio: string | null;
  photo_url: string | null;
  instagram_handle: string | null;
  is_active: boolean;
  created_at: string;
  lat: number | null;
  lng: number | null;
  address_label: string | null;
  offers_domicilio: boolean;
};

type FormData = {
  name: string;
  specialty: string;
  bio: string;
  photo_url: string;
  instagram_handle: string;
  address_label: string;
  lat: string;
  lng: string;
  offers_domicilio: boolean;
};

const emptyForm: FormData = {
  name: '', specialty: '', bio: '', photo_url: '', instagram_handle: '',
  address_label: '', lat: '', lng: '', offers_domicilio: false
};

export function BarberosContent({ initialBarbers }: { initialBarbers: Barber[] }) {
  const [barbers, setBarbers] = useState<Barber[]>(initialBarbers);
  const [showForm, setShowForm] = useState(false);
  const [editingBarber, setEditingBarber] = useState<Barber | null>(null);
  const [formData, setFormData] = useState<FormData>(emptyForm);
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Barber | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { showToast, ToastComponent } = useToast();
  const router = useRouter();

  function openCreate() {
    setEditingBarber(null);
    setFormData(emptyForm);
    setShowForm(true);
  }

  function openEdit(barber: Barber) {
    setEditingBarber(barber);
    setFormData({
      name:             barber.name,
      specialty:        barber.specialty || '',
      bio:              barber.bio || '',
      photo_url:        barber.photo_url || '',
      instagram_handle: barber.instagram_handle || '',
      address_label:    barber.address_label || '',
      lat:              barber.lat?.toString() || '',
      lng:              barber.lng?.toString() || '',
      offers_domicilio: barber.offers_domicilio,
    });
    setShowForm(true);
  }

  async function handleSave() {
    if (!formData.name.trim()) {
      showToast('El nombre es obligatorio', 'error');
      return;
    }

    setFormLoading(true);
    try {
      const latNum = parseFloat(formData.lat);
      const lngNum = parseFloat(formData.lng);
      const body = {
        name:             formData.name.trim(),
        specialty:        formData.specialty.trim() || undefined,
        bio:              formData.bio.trim() || undefined,
        photo_url:        formData.photo_url.trim() || undefined,
        instagram_handle: formData.instagram_handle.trim() || undefined,
        address_label:    formData.address_label.trim() || undefined,
        lat:              !isNaN(latNum) && formData.lat.trim() ? latNum : undefined,
        lng:              !isNaN(lngNum) && formData.lng.trim() ? lngNum : undefined,
        offers_domicilio: formData.offers_domicilio,
      };

      let res: Response;
      if (editingBarber) {
        res = await fetch(`/api/admin/barbers/${editingBarber.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      } else {
        res = await fetch('/api/admin/barbers', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
        });
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }

      const data = await res.json();
      showToast(editingBarber ? 'Barbero actualizado' : 'Barbero creado', 'success');
      setShowForm(false);
      router.refresh();

      if (editingBarber) {
        setBarbers(prev => prev.map(b => b.id === editingBarber.id ? data.barber : b));
      } else {
        setBarbers(prev => [...prev, data.barber]);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Error al guardar', 'error');
    } finally {
      setFormLoading(false);
    }
  }

  async function handleToggle(barber: Barber) {
    try {
      const res = await fetch(`/api/admin/barbers/${barber.id}`, { method: 'PATCH' });
      if (!res.ok) throw new Error('Error al cambiar estado');
      const data = await res.json();
      setBarbers(prev => prev.map(b => b.id === barber.id ? data.barber : b));
      showToast(data.barber.is_active ? 'Barbero activado' : 'Barbero desactivado', 'success');
    } catch {
      showToast('Error al cambiar el estado', 'error');
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/barbers/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al eliminar');
      }
      setBarbers(prev => prev.filter(b => b.id !== deleteTarget.id));
      showToast('Barbero eliminado', 'success');
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
        <p className="text-slate-400 text-sm">{barbers.length} barbero(s) registrado(s)</p>
        <Button onClick={openCreate} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
          <Plus className="h-4 w-4 mr-2" /> Nuevo Barbero
        </Button>
      </div>

      {/* Lista */}
      {barbers.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-slate-800 bg-slate-900/40">
          <User className="h-12 w-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-4">No hay barberos registrados aún</p>
          <Button onClick={openCreate} className="bg-amber-500 text-slate-950 hover:bg-amber-400">
            Registrar primer barbero
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {barbers.map((barber) => (
            <BarberCard
              key={barber.id}
              barber={barber}
              onEdit={() => openEdit(barber)}
              onToggle={() => handleToggle(barber)}
              onDelete={() => setDeleteTarget(barber)}
            />
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => !formLoading && setShowForm(false)}
        title={editingBarber ? 'Editar Barbero' : 'Nuevo Barbero'}
        size="md"
        footer={
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowForm(false)} disabled={formLoading}
              className="flex-1 border-slate-700 text-slate-200 hover:bg-slate-800">
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={formLoading}
              className="flex-1 bg-amber-500 text-slate-950 hover:bg-amber-400">
              {formLoading ? 'Guardando...' : editingBarber ? 'Actualizar' : 'Crear'}
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
              placeholder="Carlos Rodríguez"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Especialidad</label>
            <input
              type="text"
              value={formData.specialty}
              onChange={e => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="Fade clásico, Diseño de barba..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Biografía</label>
            <textarea
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Experiencia y estilo del barbero..."
              rows={3}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">URL de foto</label>
            <input
              type="text"
              value={formData.photo_url}
              onChange={e => setFormData({ ...formData, photo_url: e.target.value })}
              placeholder="https://..."
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Instagram (sin @)</label>
            <input
              type="text"
              value={formData.instagram_handle}
              onChange={e => setFormData({ ...formData, instagram_handle: e.target.value })}
              placeholder="carlosbarber"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm text-slate-300">Dirección / Zona</label>
            <input
              type="text"
              value={formData.address_label}
              onChange={e => setFormData({ ...formData, address_label: e.target.value })}
              placeholder="Norte, Chipichape, Cali"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Latitud (opcional)</label>
              <input
                type="number"
                step="any"
                value={formData.lat}
                onChange={e => setFormData({ ...formData, lat: e.target.value })}
                placeholder="3.4516"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-slate-300">Longitud (opcional)</label>
              <input
                type="number"
                step="any"
                value={formData.lng}
                onChange={e => setFormData({ ...formData, lng: e.target.value })}
                placeholder="-76.5320"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/50 border border-slate-800">
            <input
              id="offers_domicilio"
              type="checkbox"
              checked={formData.offers_domicilio}
              onChange={e => setFormData({ ...formData, offers_domicilio: e.target.checked })}
              className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950"
            />
            <label htmlFor="offers_domicilio" className="text-sm text-slate-200 cursor-pointer">
              Ofrece servicio a domicilio
            </label>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => !deleteLoading && setDeleteTarget(null)}
        title="Eliminar Barbero"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-slate-300">
            ¿Eliminar al barbero <strong className="text-slate-100">"{deleteTarget?.name}"</strong>?
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

function BarberCard({
  barber, onEdit, onToggle, onDelete
}: {
  barber: Barber;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={cn(
      'rounded-xl border p-5 space-y-4 transition-colors',
      barber.is_active ? 'border-slate-800 bg-slate-900/40' : 'border-slate-800/50 bg-slate-900/20 opacity-60'
    )}>
      <div className="flex items-center gap-4">
        {barber.photo_url ? (
          <div className="relative h-14 w-14 rounded-full overflow-hidden border-2 border-amber-500/30 shrink-0">
            <Image src={barber.photo_url} alt={barber.name} fill className="object-cover" />
          </div>
        ) : (
          <div className="h-14 w-14 rounded-full bg-amber-500/20 flex items-center justify-center border-2 border-amber-500/30 shrink-0">
            <span className="text-xl font-bold text-amber-400">{barber.name[0].toUpperCase()}</span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-slate-100">{barber.name}</h3>
            <span className={cn(
              'rounded-full border px-2 py-0.5 text-xs font-medium',
              barber.is_active
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                : 'border-slate-600/30 bg-slate-700/20 text-slate-500'
            )}>
              {barber.is_active ? 'Activo' : 'Inactivo'}
            </span>
            {barber.offers_domicilio && (
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                Domicilio
              </span>
            )}
          </div>
          {barber.specialty && (
            <p className="text-xs text-amber-400/80 mt-0.5">{barber.specialty}</p>
          )}
          {barber.instagram_handle && (
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-1">
              <Instagram className="h-3 w-3" /> @{barber.instagram_handle}
            </p>
          )}
        </div>
      </div>

      {barber.bio && (
        <p className="text-xs text-slate-400 line-clamp-2">{barber.bio}</p>
      )}

      <div className="flex gap-2 flex-wrap">
        <Button onClick={onToggle} variant="outline" size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 text-xs">
          {barber.is_active
            ? <><ToggleRight className="h-3.5 w-3.5 mr-1" /> Desactivar</>
            : <><ToggleLeft className="h-3.5 w-3.5 mr-1" /> Activar</>
          }
        </Button>
        <Button onClick={onEdit} variant="outline" size="sm"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-amber-400 text-xs">
          <Edit2 className="h-3.5 w-3.5 mr-1" /> Editar
        </Button>
        <Button onClick={onDelete} variant="outline" size="sm"
          className="border-rose-900/50 text-rose-400 hover:bg-rose-900/20 text-xs">
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
