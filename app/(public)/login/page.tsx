'use client';

import { useState } from 'react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { data: { user }, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

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

    // Obtener rol del usuario
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    // Redirigir según el rol
    if (profile?.role === 'admin') {
      router.push('/dashboard/admin');
    } else {
      router.push('/dashboard/customer');
    }
    router.refresh();
  }

  async function handleGoogleLogin() {
    setLoading(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard/customer` }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: email.split('@')[0],
          role: 'customer'
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    setError('Revisa tu email para confirmar tu cuenta');
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-100">BarberKing</h1>
          <p className="mt-2 text-slate-400">Inicia sesión para reservar tu cita</p>
        </header>

        {error && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-4 text-sm text-red-400">{error}</div>
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
              onClick={handleSignUp}
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
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-slate-900 px-2 text-slate-400">O continúa con</span>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 text-slate-200 hover:bg-slate-800"
        >
          Google
        </Button>
      </div>
    </div>
  );
}




