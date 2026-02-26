import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseServiceClient } from '@/lib/supabase/service';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const flow = searchParams.get('flow');           // 'login' | 'register' | null
  const intendedRole = searchParams.get('intended_role'); // 'barber' | null

  if (code) {
    const supabase = createSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      const serviceClient = createSupabaseServiceClient();

      // ── Opción A: bloquear cuentas nuevas que llegaron por el flujo de LOGIN ──
      // Si created_at tiene menos de 60 segundos es un usuario recién creado.
      // Si además el flow es 'login' (no registro), eliminamos la cuenta y devolvemos error.
      const ageMs = Date.now() - new Date(user.created_at).getTime();
      const isNewUser = ageMs < 60_000;

      if (flow === 'login' && isNewUser) {
        await serviceClient.auth.admin.deleteUser(user.id);
        return NextResponse.redirect(`${origin}/login?error=not_registered`);
      }

      // ── Registro con Google como barbero: actualizar role si es necesario ──
      if (intendedRole === 'barber') {
        const { data: existingProfile } = await serviceClient
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (existingProfile?.role === 'customer') {
          await serviceClient
            .from('profiles')
            .update({ role: 'barber' })
            .eq('id', user.id);
        }
      }

      // ── Redirigir según rol ──
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      let redirectPath: string;
      if (profile?.role === 'admin') {
        redirectPath = '/dashboard/admin';
      } else if (profile?.role === 'barber') {
        redirectPath = '/dashboard/barber';
      } else {
        redirectPath = '/dashboard/customer';
      }

      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_error`);
}
