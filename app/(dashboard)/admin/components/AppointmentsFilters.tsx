'use client';

import { useState } from 'react';
import { Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';

type AppointmentsFiltersProps = {
  onDateFilter: (date: Date | undefined) => void;
  onStatusFilter: (status: string) => void;
  selectedDate?: Date;
  selectedStatus: string;
};

export function AppointmentsFilters({
  onDateFilter,
  onStatusFilter,
  selectedDate,
  selectedStatus
}: AppointmentsFiltersProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const statusOptions = [
    { value: 'all', label: 'Todas' },
    { value: 'pending', label: 'Pendientes' },
    { value: 'confirmed', label: 'Confirmadas' },
    { value: 'completed', label: 'Completadas' },
    { value: 'cancelled', label: 'Canceladas' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-slate-400" />
        <span className="text-sm font-medium text-slate-300">Filtros:</span>
      </div>

      {/* Filtro de Fecha */}
      <div className="relative">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCalendar(!showCalendar)}
          className={cn(
            'border-slate-700 text-slate-200 hover:bg-slate-800',
            selectedDate && 'border-amber-500 bg-amber-500/10'
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {selectedDate
            ? selectedDate.toLocaleDateString('es-ES')
            : 'Todas las fechas'}
        </Button>
        {showCalendar && (
          <div className="absolute left-0 top-full z-50 mt-2">
            <div className="rounded-xl border border-slate-800 bg-slate-950 shadow-xl">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  onDateFilter(date ?? undefined);
                  setShowCalendar(false);
                }}
                className="rounded-xl"
              />
              {selectedDate && (
                <div className="border-t border-slate-800 p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onDateFilter(undefined);
                      setShowCalendar(false);
                    }}
                    className="w-full text-xs text-slate-400 hover:text-slate-200"
                  >
                    Limpiar fecha
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Filtro de Estado */}
      <div className="flex gap-2">
        {statusOptions.map((option) => (
          <Button
            key={option.value}
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onStatusFilter(option.value)}
            className={cn(
              'border-slate-700 text-slate-300 hover:bg-slate-800',
              selectedStatus === option.value && 'border-amber-500 bg-amber-500/10 text-amber-400'
            )}
          >
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
}

