import { Header } from './components/Header';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <Header />
      <main className="flex-1">{children}</main>
    </div>
  );
}







