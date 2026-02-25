/**
 * Validación de nuevas tablas tras migración SQL MEJORAS_BARBERS_SERVICES
 * Ejecuta: node scripts/validate-new-tables.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Archivo .env.local no encontrado');
    process.exit(1);
  }
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim();
      }
    }
  });
  return envVars;
}

const c = {
  reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
  yellow: '\x1b[33m', blue: '\x1b[34m', cyan: '\x1b[36m', bold: '\x1b[1m'
};
const log = (msg, color = 'reset') => console.log(`${c[color]}${msg}${c.reset}`);
const ok = (msg) => log(`   ✅ ${msg}`, 'green');
const fail = (msg) => log(`   ❌ ${msg}`, 'red');
const warn = (msg) => log(`   ⚠️  ${msg}`, 'yellow');
const info = (msg) => log(`   ℹ️  ${msg}`, 'cyan');

async function run() {
  log('\n🔍 Validando tablas y columnas nuevas (MEJORAS_BARBERS_SERVICES.sql)\n', 'cyan');

  const env = loadEnvFile();
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) { fail('Variables de entorno no encontradas'); process.exit(1); }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const isServiceKey = !!env.SUPABASE_SERVICE_ROLE_KEY;
  info(isServiceKey ? 'Usando Service Role Key (acceso completo)' : 'Usando Anon Key (RLS activo)');

  let allOk = true;

  // ──────────────────────────────────────────────
  // 1. Tabla barbers
  // ──────────────────────────────────────────────
  log('\n📋 TABLA: barbers', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('barbers')
      .select('id, name, specialty, bio, is_active', { count: 'exact' });

    if (error) { fail(`Error: ${error.message}`); allOk = false; }
    else {
      ok(`Tabla barbers accesible — ${count ?? data?.length ?? 0} barbero(s)`);
      if (data && data.length > 0) {
        data.forEach(b => info(`  • ${b.name} (${b.specialty || 'sin especialidad'}) — activo: ${b.is_active}`));
      } else {
        warn('Sin datos. Ejecuta el seed del SQL.');
      }
    }
  } catch (e) { fail(`Excepción: ${e.message}`); allOk = false; }

  // ──────────────────────────────────────────────
  // 2. Columna barber_id en appointments
  // ──────────────────────────────────────────────
  log('\n📋 COLUMNA: appointments.barber_id', 'blue');
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('id, barber_id')
      .limit(1);

    if (error && error.message.includes('barber_id')) {
      fail('Columna barber_id NO existe en appointments');
      allOk = false;
    } else if (error) {
      warn(`appointments vacía o sin acceso: ${error.message}`);
    } else {
      ok('Columna barber_id existe en appointments');
    }
  } catch (e) { fail(`Excepción: ${e.message}`); allOk = false; }

  // ──────────────────────────────────────────────
  // 3. Columnas nuevas en services
  // ──────────────────────────────────────────────
  log('\n📋 COLUMNAS: services.description, is_active, slug', 'blue');
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, price, description, is_active, slug')
      .order('price', { ascending: true });

    if (error) {
      fail(`Error al leer services: ${error.message}`);
      if (error.message.includes('description') || error.message.includes('slug') || error.message.includes('is_active')) {
        fail('Las columnas nuevas NO existen aún. Ejecuta el SQL.');
      }
      allOk = false;
    } else {
      ok(`Columnas description, is_active, slug existen en services`);
      log(`\n   Servicios encontrados: ${data?.length ?? 0}`, 'cyan');

      const withSlug = data?.filter(s => s.slug) ?? [];
      const withDesc = data?.filter(s => s.description) ?? [];
      const active = data?.filter(s => s.is_active) ?? [];

      ok(`Con slug generado: ${withSlug.length}/${data?.length ?? 0}`);
      ok(`Con descripción: ${withDesc.length}/${data?.length ?? 0}`);
      ok(`Activos (is_active): ${active.length}/${data?.length ?? 0}`);

      if (withSlug.length < (data?.length ?? 0)) {
        warn('Algunos servicios no tienen slug. Vuelve a ejecutar el bloque UPDATE del SQL.');
      }
      if (withDesc.length === 0) {
        warn('Sin descripciones aún. Ejecuta la sección 6 del SQL (UPDATE descriptions).');
      }

      log('\n   Detalle de servicios:', 'cyan');
      data?.forEach(s => {
        const slug = s.slug ? `[${s.slug}]` : '[sin slug]';
        const desc = s.description ? '✓ desc' : '✗ desc';
        const active = s.is_active ? '🟢' : '🔴';
        info(`  ${active} ${s.name} ${slug} — ${desc} — $${s.price}`);
      });
    }
  } catch (e) { fail(`Excepción: ${e.message}`); allOk = false; }

  // ──────────────────────────────────────────────
  // 4. Conexión básica y RLS
  // ──────────────────────────────────────────────
  log('\n📋 AUTENTICACIÓN y RLS', 'blue');
  try {
    // Probar que barbers público (sin auth) devuelve solo activos
    const anonClient = createClient(url, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: publicBarbers } = await anonClient
      .from('barbers')
      .select('id, name, is_active');

    if (publicBarbers) {
      const allActive = publicBarbers.every(b => b.is_active);
      if (allActive) ok(`RLS funciona: cliente anon solo ve barberos activos (${publicBarbers.length})`);
      else warn('RLS puede no estar filtrando correctamente: se ven barberos inactivos con anon key');
    }
  } catch (e) { warn(`RLS check: ${e.message}`); }

  // ──────────────────────────────────────────────
  // Resumen
  // ──────────────────────────────────────────────
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  if (allOk) {
    log('✅ Todas las validaciones pasaron — BD lista para las nuevas features', 'green');
  } else {
    log('⚠️  Algunas validaciones fallaron — revisa los errores arriba y ejecuta el SQL pendiente', 'yellow');
  }
  log('', 'reset');
  return allOk;
}

run().then(ok => process.exit(ok ? 0 : 1)).catch(e => {
  console.error('❌ Error fatal:', e.message);
  process.exit(1);
});
