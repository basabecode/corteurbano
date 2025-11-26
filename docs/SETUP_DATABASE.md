# 🗄️ Configuración de Base de Datos - BarberKing

Esta guía te ayudará a configurar la base de datos en Supabase para BarberKing.

## 📋 Requisitos Previos

1. Cuenta en [Supabase](https://supabase.com)
2. Proyecto creado en Supabase
3. Acceso al SQL Editor

## 🚀 Pasos de Configuración

### Paso 1: Ejecutar Script SQL

1. Ve a tu proyecto en Supabase Dashboard
2. Navega a **SQL Editor** en el menú lateral
3. Crea una nueva query
4. Copia y pega el siguiente script completo:

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

-- Función helper para verificar si un usuario es admin (evita recursión infinita)
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

-- PERFIL: cada usuario sólo ve el suyo; admins ven todos
create policy "perfil_propio_visible"
on public.profiles
for select using (auth.uid() = id);

create policy "admin_ve_todos_perfiles"
on public.profiles
for select using (public.is_admin(auth.uid()));

create policy "usuario_actualiza_perfil_propio"
on public.profiles
for update using (auth.uid() = id);

-- SERVICES: lectura pública, sólo admin modifica
create policy "servicios_visibles"
on public.services
for select using (true);

create policy "admin_gestiona_servicios"
on public.services
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- APPOINTMENTS: clientes ven/crean los suyos; admins ven todos
create policy "cliente crea cita propia"
on public.appointments
for insert with check (client_id = auth.uid());

create policy "cliente ve sus citas"
on public.appointments
for select using (client_id = auth.uid());

create policy "cliente actualiza su cita"
on public.appointments
for update using (client_id = auth.uid());

create policy "admin_acceso_total_citas"
on public.appointments
for all
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));
```

5. Haz clic en **Run** o presiona `Ctrl+Enter`
6. Verifica que no haya errores

### Paso 2: Crear Trigger para Perfiles Automáticos

Ejecuta este script adicional para crear automáticamente un perfil cuando un usuario se registra:

```sql
-- Función para crear perfil automáticamente
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

-- Trigger que se ejecuta cuando se crea un usuario
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### Paso 3: Insertar Datos Iniciales

Ejecuta este script para crear servicios de ejemplo:

```sql
-- Insertar servicios de ejemplo
insert into public.services (name, price, duration_minutes, image_url) values
  ('Corte Clásico', 25.00, 45, null),
  ('Afeitado Premium', 30.00, 40, null),
  ('Fade + Barba', 35.00, 60, null),
  ('Corte + Barba + Bigote', 40.00, 75, null),
  ('Tratamiento Capilar', 20.00, 30, null)
on conflict do nothing;
```

### Paso 4: Crear Usuario Admin

1. Ve a **Authentication** > **Users** en Supabase
2. Crea un nuevo usuario manualmente o regístrate desde la app
3. Anota el `id` del usuario (UUID)
4. Ejecuta este script reemplazando `'TU_USER_ID_AQUI'` con el UUID real:

```sql
-- Convertir usuario a admin
update public.profiles
set role = 'admin'
where id = 'TU_USER_ID_AQUI';
```

## ✅ Verificación

Para verificar que todo está configurado correctamente:

1. **Verificar tablas:**
```sql
select table_name from information_schema.tables 
where table_schema = 'public' 
and table_name in ('profiles', 'services', 'appointments');
```

2. **Verificar políticas RLS:**
```sql
select tablename, policyname from pg_policies 
where schemaname = 'public';
```

3. **Verificar servicios:**
```sql
select * from public.services;
```

## 🔒 Seguridad

- Las políticas RLS están activas y protegen los datos
- Los clientes solo pueden ver/editar sus propias citas
- Los admins tienen acceso completo
- El `service_role_key` solo debe usarse en el servidor (nunca en el cliente)

## 🐛 Troubleshooting

### Error: "relation already exists"
- Las tablas ya existen. Puedes eliminarlas primero o usar `DROP TABLE IF EXISTS`.

### Error: "permission denied"
- Verifica que estés usando el SQL Editor con permisos de administrador.

### Las políticas RLS bloquean todo
- Verifica que el usuario esté autenticado correctamente.
- Revisa que las políticas estén creadas correctamente.

---

**Nota:** Guarda este documento como referencia para futuras configuraciones.




