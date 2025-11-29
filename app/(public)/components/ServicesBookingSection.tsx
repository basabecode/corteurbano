'use client';

import { useState } from 'react';
import { ServiceCard } from './ServiceCard';
import { BookingForm } from './BookingForm';

type Service = {
    id: string;
    name: string;
    price: number;
    duration_minutes: number;
    image_url: string | null;
};

type ServicesBookingSectionProps = {
    services: Service[];
    busySlots: string[];
};

export function ServicesBookingSection({ services, busySlots }: ServicesBookingSectionProps) {
    const [preSelectedServiceId, setPreSelectedServiceId] = useState<string | null>(null);

    const handleServiceSelect = (serviceId: string) => {
        setPreSelectedServiceId(serviceId);
        // Scroll to booking form
        setTimeout(() => {
            const agendaSection = document.getElementById('agenda');
            if (agendaSection) {
                agendaSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    return (
        <>
            <section id="servicios" className="space-y-6">
                <header>
                    <p className="text-sm uppercase tracking-[0.3em] text-amber-500">Servicios signature</p>
                    <h2 className="text-3xl font-bold text-slate-100">Cortes diseñados para líderes</h2>
                </header>
                <div className="grid gap-6 md:grid-cols-3">
                    {services.map((service) => (
                        <ServiceCard
                            key={service.id}
                            serviceId={service.id}
                            name={service.name}
                            duration={service.duration_minutes}
                            price={service.price}
                            imageUrl={service.image_url ?? undefined}
                            onReserve={handleServiceSelect}
                        />
                    ))}
                </div>
            </section>

            <BookingForm
                services={services}
                busySlots={busySlots}
                preSelectedServiceId={preSelectedServiceId}
                onServiceSelected={() => setPreSelectedServiceId(null)}
            />
        </>
    );
}
