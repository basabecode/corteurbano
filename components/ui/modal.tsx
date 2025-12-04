'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  // Prevenir scroll del body cuando el modal está abierto
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'md:max-w-md',
    md: 'md:max-w-lg',
    lg: 'md:max-w-2xl',
    xl: 'md:max-w-4xl'
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal - Fullscreen en móvil, centrado en desktop */}
      <div
        className={cn(
          'relative z-50 w-full flex flex-col',
          'h-[95vh] md:h-auto', // Fullscreen en móvil
          'rounded-t-3xl md:rounded-2xl', // Bordes redondeados arriba en móvil
          'border-t-2 md:border border-slate-800',
          'bg-slate-950 shadow-2xl',
          'max-h-[95vh] md:max-h-[90vh]', // Altura máxima
          'animate-slide-up md:animate-fade-in', // Animación desde abajo en móvil
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header - Sticky en móvil */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm px-4 md:px-6 py-4">
          <h2 className="text-lg md:text-xl font-semibold text-slate-100">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100 active:scale-95"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5 md:h-6 md:w-6" />
          </button>
        </div>

        {/* Content - Scrolleable */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 md:px-6 py-4 md:py-6">
          {children}
        </div>

        {/* Footer - Sticky en móvil */}
        {footer && (
          <div className="sticky bottom-0 z-10 border-t border-slate-800 bg-slate-950/95 backdrop-blur-sm px-4 md:px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
