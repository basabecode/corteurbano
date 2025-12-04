'use client';

import { useEffect } from 'react';

/**
 * Componente que completa automáticamente citas pasadas al cargar
 */
export function AutoCompletePastAppointments() {
    useEffect(() => {
        // Completar citas pasadas al cargar el componente
        async function completePastAppointments() {
            try {
                await fetch('/api/appointments/complete-past', {
                    method: 'POST',
                    cache: 'no-store'
                });
            } catch (error) {
                console.error('Error completing past appointments:', error);
                // Silenciosamente falla, no afecta la experiencia del usuario
            }
        }

        completePastAppointments();
    }, []);

    // Este componente no renderiza nada
    return null;
}
