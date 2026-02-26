'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Scissors } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

function RegistroContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tipo = searchParams.get('tipo'); // 'cliente' | 'barbero' | null

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const role = tipo === 'barbero' ? 'barber' : 'customer';

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
          role,
        },
      },
    });

    if (error) {
      setMessage({ text: error.message, isError: true });
    } else {
      setMessage({
        text: 'Revisa tu email para confirmar tu cuenta. Luego podrás iniciar sesión.',
        isError: false,
      });
    }
    setLoading(false);
  }

  async function handleGoogleSignUp() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback${role === 'barber' ? '?intended_role=barber' : ''}`,
      },
    });

    if (error) {
      setMessage({ text: error.message, isError: true });
      setLoading(false);
    }
  }

  // Role selection screen
  if (!tipo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
        <div className="w-full max-w-md space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors"
          >
            ← Inicio
          </Link>
          <header className="text-center">
            <h1 className="text-3xl font-bold text-slate-100">Crear cuenta</h1>
            <p className="mt-2 text-slate-400">¿Cómo deseas registrarte?</p>
          </header>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Link
              href="/registro?tipo=cliente"
              className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center hover:border-amber-500/50 hover:bg-slate-900 transition-all duration-200"
            >
              <div className="rounded-full bg-amber-500/10 p-4 group-hover:bg-amber-500/20 transition-colors">
                <User className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Soy Cliente</h2>
                <p className="mt-1 text-sm text-slate-500">Reserva citas y gestiona tus turnos</p>
              </div>
            </Link>

            <Link
              href="/registro?tipo=barbero"
              className="group flex flex-col items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center hover:border-emerald-500/50 hover:bg-slate-900 transition-all duration-200"
            >
              <div className="rounded-full bg-emerald-500/10 p-4 group-hover:bg-emerald-500/20 transition-colors">
                <Scissors className="h-8 w-8 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Soy Barbero</h2>
                <p className="mt-1 text-sm text-slate-500">Accede a tu panel y ve tus citas</p>
              </div>
            </Link>
          </div>

          <p className="text-center text-sm text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Registration form
  const isBarber = tipo === 'barbero';
  const accentColor = isBarber ? 'emerald' : 'amber';

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors"
        >
          ← Inicio
        </Link>
        <header className="text-center">
          <div className={`inline-flex rounded-full p-3 mb-3 ${isBarber ? 'bg-emerald-500/10' : 'bg-amber-500/10'}`}>
            {isBarber ? (
              <Scissors className="h-6 w-6 text-emerald-400" />
            ) : (
              <User className="h-6 w-6 text-amber-400" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-slate-100">
            {isBarber ? 'Registro de Barbero' : 'Registro de Cliente'}
          </h1>
          <p className="mt-2 text-slate-400">
            {isBarber
              ? 'Crea tu cuenta para acceder a tu panel'
              : 'Crea tu cuenta para reservar citas'}
          </p>
        </header>

        {message && (
          <div
            className={`rounded-xl border p-4 text-sm ${
              message.isError
                ? 'border-red-500/50 bg-red-500/10 text-red-400'
                : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className={`w-full rounded-xl ${isBarber ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-amber-500 hover:bg-amber-400'} text-slate-950`}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-900 px-2 text-slate-400">O regístrate con</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={loading}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
        >
          Google
        </Button>

        <p className="text-center text-sm text-slate-500">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-amber-400 hover:text-amber-300 transition-colors">
            Inicia sesión
          </Link>
        </p>

        <p className="text-center text-sm text-slate-500">
          ¿Registrarte como{' '}
          <Link
            href={isBarber ? '/registro?tipo=cliente' : '/registro?tipo=barbero'}
            className="text-slate-400 hover:text-slate-300 transition-colors"
          >
            {isBarber ? 'cliente' : 'barbero'}
          </Link>
          ?
        </p>
      </div>
    </div>
  );
}

export default function RegistroPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-400">Cargando...</div>
      </div>
    }>
      <RegistroContent />
    </Suspense>
  );
}
