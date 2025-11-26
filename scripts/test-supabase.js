/**
 * Script de prueba para validar conexión con Supabase
 * Ejecuta: node scripts/test-supabase.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Archivo .env.local no encontrado');
    console.log('💡 Crea el archivo .env.local con tus credenciales de Supabase');
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

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testSupabaseConnection() {
  log('\n🔍 Iniciando pruebas de conexión con Supabase...\n', 'cyan');

  // 1. Verificar variables de entorno
  log('📋 Paso 1: Verificando variables de entorno...', 'blue');
  const env = loadEnvFile();

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    log('❌ NEXT_PUBLIC_SUPABASE_URL no encontrado', 'red');
    return false;
  }
  log(`   ✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl.substring(0, 30)}...`, 'green');

  if (!supabaseAnonKey) {
    log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY no encontrado', 'red');
    return false;
  }
  log(`   ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}...`, 'green');

  if (!supabaseServiceKey) {
    log('⚠️  SUPABASE_SERVICE_ROLE_KEY no encontrado (opcional para algunas pruebas)', 'yellow');
  } else {
    log(`   ✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey.substring(0, 20)}...`, 'green');
  }

  // 2. Crear cliente Supabase
  log('\n🔌 Paso 2: Creando cliente de Supabase...', 'blue');
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  log('   ✅ Cliente creado exitosamente', 'green');

  // 3. Probar conexión básica
  log('\n🌐 Paso 3: Probando conexión básica...', 'blue');
  try {
    const { data, error } = await supabase.from('services').select('count').limit(1);
    
    if (error) {
      log(`   ❌ Error de conexión: ${error.message}`, 'red');
      log(`   📝 Código: ${error.code || 'N/A'}`, 'yellow');
      log(`   💡 Detalles: ${error.details || 'N/A'}`, 'yellow');
      return false;
    }
    log('   ✅ Conexión exitosa', 'green');
  } catch (err) {
    log(`   ❌ Error inesperado: ${err.message}`, 'red');
    return false;
  }

  // 4. Verificar tablas
  log('\n📊 Paso 4: Verificando tablas...', 'blue');
  const tables = ['profiles', 'services', 'appointments'];
  const tableStatus = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          log(`   ❌ Tabla '${table}' no existe`, 'red');
          log(`   💡 Ejecuta el script SQL de docs/SETUP_DATABASE.md`, 'yellow');
          tableStatus[table] = false;
        } else {
          log(`   ⚠️  Tabla '${table}' existe pero hay error: ${error.message}`, 'yellow');
          tableStatus[table] = 'partial';
        }
      } else {
        log(`   ✅ Tabla '${table}' existe y es accesible`, 'green');
        tableStatus[table] = true;
      }
    } catch (err) {
      log(`   ❌ Error al verificar tabla '${table}': ${err.message}`, 'red');
      tableStatus[table] = false;
    }
  }

  // 5. Verificar datos en servicios
  log('\n📦 Paso 5: Verificando datos en tabla services...', 'blue');
  try {
    const { data, error, count } = await supabase
      .from('services')
      .select('*', { count: 'exact' })
      .limit(5);

    if (error) {
      log(`   ⚠️  Error al leer servicios: ${error.message}`, 'yellow');
    } else {
      log(`   ✅ Servicios encontrados: ${count || data?.length || 0}`, 'green');
      if (data && data.length > 0) {
        log('   📋 Primeros servicios:', 'cyan');
        data.forEach((service, idx) => {
          log(`      ${idx + 1}. ${service.name} - $${service.price} (${service.duration_minutes} min)`, 'cyan');
        });
      } else {
        log('   ⚠️  No hay servicios registrados', 'yellow');
        log('   💡 Ejecuta el script SQL de inserción de docs/SETUP_DATABASE.md', 'yellow');
      }
    }
  } catch (err) {
    log(`   ❌ Error: ${err.message}`, 'red');
  }

  // 6. Probar autenticación (sin login real)
  log('\n🔐 Paso 6: Verificando configuración de autenticación...', 'blue');
  try {
    const { data, error } = await supabase.auth.getSession();
    // Esto debería funcionar incluso sin sesión
    log('   ✅ Módulo de autenticación disponible', 'green');
  } catch (err) {
    log(`   ⚠️  Advertencia en autenticación: ${err.message}`, 'yellow');
  }

  // 7. Resumen final
  log('\n📊 Resumen de pruebas:', 'cyan');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
  
  const allTablesOk = Object.values(tableStatus).every(status => status === true);
  
  if (allTablesOk) {
    log('✅ Todas las pruebas pasaron exitosamente', 'green');
    log('🎉 Tu conexión con Supabase está funcionando correctamente', 'green');
  } else {
    log('⚠️  Algunas pruebas fallaron', 'yellow');
    log('💡 Revisa los errores arriba y ejecuta el script SQL de docs/SETUP_DATABASE.md', 'yellow');
  }

  log('\n', 'reset');
  return allTablesOk;
}

// Ejecutar pruebas
testSupabaseConnection()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(err => {
    log(`\n❌ Error fatal: ${err.message}`, 'red');
    console.error(err);
    process.exit(1);
  });

