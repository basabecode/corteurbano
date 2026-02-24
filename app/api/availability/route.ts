import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const barberId = searchParams.get('barberId');

  const supabase = createSupabaseServerClient();

  let query = supabase
    .from('appointments')
    .select('start_time')
    .in('status', ['pending', 'confirmed'])
    .gte('start_time', new Date().toISOString());

  if (barberId) {
    query = query.eq('barber_id', barberId);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: 'Error al obtener disponibilidad' }, { status: 500 });
  }

  const busySlots = data?.map((a: { start_time: string }) => a.start_time) ?? [];
  return NextResponse.json({ busySlots });
}
