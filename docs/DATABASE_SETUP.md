# 🗄️ Configuración de Base de Datos - BarberKing

Esta guía detalla cómo configurar la base de datos PostgreSQL en Supabase, incluyendo tablas, seguridad (RLS) y datos iniciales.

## 📋 Instrucciones

1.  Ve a tu proyecto en [Supabase Dashboard](https://supabase.com/dashboard).
2.  Abre el **SQL Editor**.
3.  Ejecuta los siguientes scripts en orden.

### 1. Esquema Principal y Seguridad

Este script crea las tablas `profiles`, `services`, `appointments` y configura las políticas de seguridad (RLS). Incluye la corrección para evitar recursión infinita en las políticas de admin.

```sql
-- Perfiles enlazados a auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','customer')),
  telegram_chat_id text,
  full_name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes int not null check (duration_minutes > 0),
  image_url text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid not null references public.services(id) on delete restrict,
  start_time timestamptz not null,
  status text not null check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

-- Triggers para timestamps
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.handle_updated_at();

create trigger appointments_set_updated_at
before update on public.appointments
for each row execute procedure public.handle_updated_at();

-- Activar RLS
alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.appointments enable row level security;

-- Función helper para verificar admin (SECURITY DEFINER para evitar recursión)
create or replace function public.is_admin(user_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 
    from public.profiles 
    where id = user_id 
    and role = 'admin'
  );
$$;

-- POLÍTICAS RLS

-- Profiles
create policy "perfil_propio_visible" on public.profiles for select using (auth.uid() = id);
create policy "admin_ve_todos_perfiles" on public.profiles for select using (public.is_admin(auth.uid()));
create policy "usuario_actualiza_perfil_propio" on public.profiles for update using (auth.uid() = id);

-- Services
create policy "servicios_visibles" on public.services for select using (true);
create policy "admin_gestiona_servicios" on public.services for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- Appointments
create policy "cliente_crea_cita_propia" on public.appointments for insert with check (client_id = auth.uid());
create policy "cliente_ve_sus_citas" on public.appointments for select using (client_id = auth.uid());
create policy "cliente_actualiza_su_cita" on public.appointments for update using (client_id = auth.uid());
create policy "admin_acceso_total_citas" on public.appointments for all using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
```

### 2. Automatización de Perfiles

Este script crea automáticamente un perfil cuando un usuario se registra.

```sql
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'customer'),
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 3. Datos Iniciales (Seed)

Inserta servicios de ejemplo.

```sql
insert into public.services (name, description, price, duration_minutes) values
  ('Corte Clásico', 'Corte tradicional con tijera y máquina', 25.00, 30),
  ('Corte + Barba', 'Corte completo más arreglo de barba', 40.00, 45),
  ('Afeitado Premium', 'Afeitado con navaja y toalla caliente', 30.00, 30),
  ('Corte Niño', 'Corte especial para niños', 18.00, 25),
  ('Diseño de Barba', 'Diseño y perfilado de barba', 20.00, 25),
  ('Tratamiento Capilar', 'Tratamiento premium para el cabello', 35.00, 40)
on conflict do nothing;
```

---

## 🔍 Verificación

Para verificar que todo está correcto, puedes ejecutar:

```sql
-- Verificar tablas
select table_name from information_schema.tables 
where table_schema = 'public' 
and table_name in ('profiles', 'services', 'appointments');

-- Verificar servicios
select * from public.services;
```

### Script de Prueba (Node.js)

Puedes usar el script `scripts/test-supabase.js` (si existe) o crear uno simple para verificar la conexión desde tu código.

```javascript
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

supabase.from('services').select('count').then(({ data, error }) => {
  if (error) console.error('❌ Error:', error.message);
  else console.log('✅ Conexión exitosa');
});
```
