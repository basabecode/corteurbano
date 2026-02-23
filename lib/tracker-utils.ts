export interface TrackerAppointment {
  status: string;
  start_time: string;
  services: {
    duration_minutes: number;
  };
}

/**
 * Determina el índice del paso actual en el Stepper basado en el estado
 * y la hora de la cita. (Implementación lógica extraída para Unit Testing).
 */
export function getCurrentStepIndex(appointment: TrackerAppointment, now: Date = new Date()): number {
  if (appointment.status === 'cancelled') return -1;
  if (appointment.status === 'completed') return 3;

  // Lógica híbrida: Si esta confirmada pero es la hora de la cita (+- duración) mostramos 'en servicio'
  if (appointment.status === 'confirmed') {
    const start = new Date(appointment.start_time);
    const end = new Date(start.getTime() + appointment.services.duration_minutes * 60000);

    // Si la hora actual está dentro del rango de inicio y fin
    if (now >= start && now <= end) {
      return 2; // in_service
    }
    return 1; // confirmed (antes o después sin completar)
  }

  return 0; // pending
}
