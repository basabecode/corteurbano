import { AppointmentList } from './components/AppointmentList';

const mockAppointments = [
  { id: '1', service: 'Fade + Barba', date: '2025-11-26T16:00:00.000Z', status: 'confirmed' as const },
  { id: '2', service: 'Corte Clásico', date: '2025-12-01T15:00:00.000Z', status: 'pending' as const }
];

export default function CustomerDashboard() {
  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-slate-100">Tus citas</h2>
      <AppointmentList appointments={mockAppointments} />
    </div>
  );
}




