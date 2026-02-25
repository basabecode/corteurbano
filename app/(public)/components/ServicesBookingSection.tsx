'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ServiceCard } from './ServiceCard';
import { BookingForm } from './BookingForm';
import { Scissors, ChevronRight } from 'lucide-react';

type Service = {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    image_url: string | null;
};

type Barber = {
    id: string;
    name: string;
    photo_url: string | null;
    specialty: string | null;
};

type ServicesBookingSectionProps = {
    services: Service[];
    busySlots: string[];
    barbers: Barber[];
};

export function ServicesBookingSection({ services, busySlots, barbers }: ServicesBookingSectionProps) {
    const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | null>(null);

    const handleServiceSelect = (serviceId: string) => {
        setPreSelectedServiceId(serviceId);
        setTimeout(() => {
            const agendaSection = document.getElementById('agenda');
            if (agendaSection) {
                agendaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <>
            {/* Sección de servicios */}
            <section id="servicios" className="space-y-6">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-[0.4em] text-yellow-500/80 mb-2">Tipos de Servicios</p>
                        <h2 className="font-display text-4xl md:text-5xl font-bold text-slate-100 leading-tight">
                            Cortes diseñados para<br className="hidden md:block" /> un verdadero hombre.
                        </h2>
                    </div>
                    <Link
                        href="/servicios"
                        className="flex items-center gap-1.5 text-sm text-yellow-400 hover:text-yellow-300 transition-colors whitespace-nowrap"
                    >
                        Ver todos <ChevronRight className="h-4 w-4" />
                    </Link>
                </header>
                <div className="grid gap-6 md:grid-cols-3">
                    {services.map((service, i) => (
                        <ServiceCard
                            key={service.id}
                            serviceId={service.id}
                            name={service.name}
                            duration={service.duration_minutes}
                            price={service.price}
                            imageUrl={service.image_url ?? undefined}
                            index={i}
                            onReserve={handleServiceSelect}
                        />
                    ))}
                </div>
            </section>

            {/* Banner CTA entre servicios y formulario */}
            <div className="rounded-2xl border border-yellow-500/20 bg-yellow-500/5 px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <div className="rounded-xl bg-yellow-500/10 p-3 shrink-0">
                        <Scissors className="h-7 w-7 text-yellow-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-100">¿Listo para tu corte?</h3>
                        <p className="text-sm text-slate-400">Reserva en menos de 2 minutos, sin llamadas.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <a
                        href="#agenda"
                        className="text-center rounded-full bg-yellow-500 px-5 py-2.5 text-sm font-semibold uppercase tracking-wide text-slate-950 shadow-lg shadow-yellow-500/30 transition-all duration-300 hover:bg-yellow-400 hover:scale-105 whitespace-nowrap"
                    >
                        Reservar ahora
                    </a>
                    <Link
                        href="/servicios"
                        className="text-center rounded-full border border-yellow-500/30 px-5 py-2.5 text-sm font-medium text-yellow-400 transition-all duration-300 hover:border-yellow-400 hover:bg-yellow-500/10 whitespace-nowrap"
                    >
                        Ver todos los servicios
                    </Link>
                </div>
            </div>

            {/* Formulario de reserva */}
            <BookingForm
                services={services}
                busySlots={busySlots}
                barbers={barbers}
                preSelectedServiceId={preSelectedServiceId}
                onServiceSelected={() => setPreSelectedServiceId(null)}
            />
        </>
    );
}
