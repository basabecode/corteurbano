import { getCurrentStepIndex, TrackerAppointment } from '../../lib/tracker-utils';

describe('Live Appointment Tracker Lógica', () => {
  const baseAppointment: TrackerAppointment = {
    status: 'pending',
    start_time: '2026-05-10T10:00:00Z',
    services: {
      duration_minutes: 30,
    },
  };

  it('debe retornar 0 para citas "pending"', () => {
    const index = getCurrentStepIndex({ ...baseAppointment, status: 'pending' });
    expect(index).toBe(0);
  });

  it('debe retornar 1 para citas "confirmed" antes de la hora de inicio', () => {
    const now = new Date('2026-05-10T09:00:00Z'); // Una hora antes
    const index = getCurrentStepIndex({ ...baseAppointment, status: 'confirmed' }, now);
    expect(index).toBe(1);
  });

  it('debe retornar 2 ("in_service") para citas confirmadas durante su horario', () => {
    const now = new Date('2026-05-10T10:15:00Z'); // Justo a la mitad de la cita (dura 30 min)
    const index = getCurrentStepIndex({ ...baseAppointment, status: 'confirmed' }, now);
    expect(index).toBe(2);
  });

  it('debe retornar 1 para citas confirmadas si ya pasó la hora pero no se han marcado completadas', () => {
    const now = new Date('2026-05-10T11:00:00Z'); // Una hora después
    const index = getCurrentStepIndex({ ...baseAppointment, status: 'confirmed' }, now);
    expect(index).toBe(1); // Mantenemos confirmed si el admin olvidó marcar completed
  });

  it('debe retornar 3 para citas "completed"', () => {
    const index = getCurrentStepIndex({ ...baseAppointment, status: 'completed' });
    expect(index).toBe(3);
  });

  it('debe retornar -1 para citas "cancelled"', () => {
    const index = getCurrentStepIndex({ ...baseAppointment, status: 'cancelled' });
    expect(index).toBe(-1);
  });
});
