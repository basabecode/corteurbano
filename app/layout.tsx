import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BarberKing · Agenda de cortes premium',
  description: 'Reserva tu cita en BarberKing con estilo Dark Luxury.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="bg-slate-950">
      <body className="min-h-screen bg-slate-950 text-slate-100">{children}</body>
    </html>
  );
}







