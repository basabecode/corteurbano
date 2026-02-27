/**
 * Script: Verifica constraint de rol barbero y crea cuenta de prueba
 * Uso: node scripts/setup-barber-test.mjs
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('❌ Faltan variables de entorno. Asegúrate de tener .env.local con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function verificarConstraint() {
  console.log('\n🔍 Verificando constraint profiles_role_check...')

  const { data, error } = await supabase.rpc('exec_sql', {
    sql: `SELECT conname, pg_get_constraintdef(oid) AS definition
          FROM pg_constraint
          WHERE conname = 'profiles_role_check';`
  }).single()

  if (error) {
    // fallback: consultar information_schema
    const { data: cols, error: e2 } = await supabase
      .from('profiles')
      .select('role')
      .limit(1)

    if (e2) {
      console.log('⚠️  No se pudo consultar directamente el constraint, pero la tabla profiles existe.')
    }

    // intentar insertar un role inválido para verificar si el check existe
    const { error: checkError } = await supabase
      .from('profiles')
      .insert({ id: '00000000-0000-0000-0000-000000000000', role: 'INVALID_ROLE_TEST', full_name: 'TEST' })

    if (checkError?.message?.includes('profiles_role_check') || checkError?.message?.includes('check')) {
      console.log('✅ Constraint profiles_role_check EXISTE (rechaza valores inválidos)')
    } else {
      console.log('⚠️  Constraint status incierto. Mensaje de error:', checkError?.message)
    }
  } else {
    console.log('✅ Constraint encontrado:', data)
  }
}

async function verificarColumnaProfileId() {
  console.log('\n🔍 Verificando columna profile_id en barbers...')
  const { data, error } = await supabase
    .from('barbers')
    .select('id, name, profile_id')
    .limit(3)

  if (error) {
    console.log('❌ Error al consultar barbers.profile_id:', error.message)
    if (error.message.includes('profile_id')) {
      console.log('⚠️  La columna profile_id NO existe. Debes ejecutar: supabase/migrations/20260225_add_barber_role.sql')
    }
  } else {
    console.log('✅ Columna profile_id existe en barbers.')
    console.log('   Muestra de barberos:', data?.map(b => `${b.name} (profile_id: ${b.profile_id ?? 'null'})`).join(', '))
  }
}

async function crearCuentaBarbero() {
  const email    = 'barbero@test.com'
  const password = process.env.TEST_BARBER_PASSWORD
  const nombre   = 'Barbero Test'

  if (!password) {
    console.error('❌ Falta la variable TEST_BARBER_PASSWORD.')
    console.error('   Defínela en .env.local o pásala inline:')
    console.error('   TEST_BARBER_PASSWORD=tuClave node scripts/setup-barber-test.mjs')
    process.exit(1)
  }

  console.log(`\n👤 Creando cuenta: ${email}...`)

  // 1. Verificar si ya existe
  const { data: existing, error: listError } = await supabase.auth.admin.listUsers()
  if (!listError) {
    const found = existing.users.find(u => u.email === email)
    if (found) {
      console.log(`ℹ️  El usuario ${email} ya existe (id: ${found.id})`)
      // Asegurarnos de que el perfil tiene rol barber
      await asegurarPerfil(found.id, nombre)
      return found.id
    }
  }

  // 2. Crear usuario en Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: nombre }
  })

  if (authError) {
    console.error('❌ Error creando usuario Auth:', authError.message)
    return null
  }

  const userId = authData.user.id
  console.log(`✅ Usuario Auth creado (id: ${userId})`)

  await asegurarPerfil(userId, nombre)
  return userId
}

async function asegurarPerfil(userId, nombre) {
  console.log('\n📋 Asegurando perfil con role=barber...')

  // Upsert del perfil
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id:        userId,
      full_name: nombre,
      role:      'barber',
      phone:     '+573000000001'
    }, { onConflict: 'id' })
    .select()
    .single()

  if (error) {
    console.error('❌ Error al hacer upsert del perfil:', error.message)
    if (error.message.includes('profiles_role_check')) {
      console.log('\n⚠️  El CHECK constraint NO incluye "barber".')
      console.log('   Ejecuta este SQL en Supabase Dashboard → SQL Editor:\n')
      console.log('   ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;')
      console.log('   ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check')
      console.log("     CHECK (role IN ('admin', 'customer', 'barber'));")
    }
  } else {
    console.log(`✅ Perfil con role=barber configurado:`, data)
  }
}

async function vincularBarbero(userId) {
  console.log('\n🔗 Vinculando perfil con un barbero existente (profile_id)...')

  const { data: barbers, error } = await supabase
    .from('barbers')
    .select('id, name, profile_id')
    .is('profile_id', null)
    .limit(5)

  if (error) {
    if (error.message.includes('profile_id')) {
      console.log('⚠️  La columna profile_id no existe todavía en barbers — ejecuta la migración 20260225_add_barber_role.sql')
      return
    }
    console.error('❌ Error al listar barberos:', error.message)
    return
  }

  if (!barbers || barbers.length === 0) {
    console.log('ℹ️  No hay barberos sin vincular. Puedes vincular manualmente desde el admin.')
    return
  }

  const primerBarbero = barbers[0]
  const { error: upError } = await supabase
    .from('barbers')
    .update({ profile_id: userId })
    .eq('id', primerBarbero.id)

  if (upError) {
    console.error('❌ Error al vincular barbero:', upError.message)
  } else {
    console.log(`✅ Barbero "${primerBarbero.name}" vinculado a barbero@test.com`)
  }
}

async function main() {
  console.log('═══════════════════════════════════════════')
  console.log('  Setup: Cuenta Barbero Test — Corte Urbano')
  console.log('═══════════════════════════════════════════')

  await verificarConstraint()
  await verificarColumnaProfileId()

  const userId = await crearCuentaBarbero()
  if (userId) {
    await vincularBarbero(userId)
  }

  console.log('\n═══════════════════════════════════════════')
  console.log('  Credenciales de prueba:')
  console.log('  Email:    barbero@test.com')
  console.log('  Password: (la que definiste en TEST_BARBER_PASSWORD)')
  console.log('  Panel:    /dashboard/barber')
  console.log('═══════════════════════════════════════════\n')
}

main().catch(console.error)
