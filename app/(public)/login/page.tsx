'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';

const ERROR_MESSAGES: Record<string, { text: string; isWarning?: boolean }> = {
  not_registered: {
    text: 'No encontramos una cuenta registrada con ese correo de Google. Regístrate primero en /registro.',
    isWarning: true,
  },
  auth_error: {
    text: 'Ocurrió un error al iniciar sesión. Intenta de nuevo.',
  },
};

function LoginContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const urlError = searchParams.get('error');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mensaje de error de URL (ej. not_registered desde callback)
  const urlErrorMsg = urlError ? ERROR_MESSAGES[urlError] : null;

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    if (!user) {
      setError('Error al iniciar sesión');
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'admin') {
      router.push('/dashboard/admin');
    } else if (profile?.role === 'barber') {
      router.push('/dashboard/barber');
    } else {
      router.push('/dashboard/customer');
    }
    router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();

    // flow=login → el callback detectará si es cuenta nueva y la bloqueará
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?flow=login`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-amber-400 transition-colors"
        >
          ← Inicio
        </Link>

        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-100">Corte Urbano</h1>
          <p className="mt-2 text-slate-400">Inicia sesión para reservar tu cita</p>
        </header>

        {/* Error de URL (ej. cuenta nueva bloqueada) */}
        {urlErrorMsg && (
          <div className={`rounded-xl border p-4 text-sm ${
            urlErrorMsg.isWarning
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
              : 'border-red-500/50 bg-red-500/10 text-red-400'
          }`}>
            {urlErrorMsg.text}
            {urlErrorMsg.isWarning && (
              <a
                href="/registro"
                className="ml-1 underline underline-offset-2 hover:text-amber-200 transition-colors"
              >
                Ir a registro
              </a>
            )}
          </div>
        )}

        {/* Error de formulario */}
        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4">
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
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400"
            >
              {loading ? 'Cargando...' : 'Iniciar sesión'}
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/registro')}
              disabled={loading}
              variant="outline"
              className="flex-1 rounded-xl border-slate-700 text-slate-200 hover:bg-slate-800"
            >
              Registrarse
            </Button>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-900 px-3 text-slate-500">O continúa con</span>
          </div>
        </div>

        <div className="space-y-2">
          <Button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
          >
            Google
          </Button>
          <p className="text-center text-xs text-slate-600">
            Solo funciona si ya tienes una cuenta registrada
          </p>
        </div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="text-slate-500 text-sm">Cargando...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
