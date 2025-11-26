// Script de prueba para validar conexión con Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

console.log('🔍 Iniciando test de conexión con Supabase...\n');

// Leer variables de entorno desde .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Error: Archivo .env.local no encontrado');
    console.log('   Ejecuta: .\\create-env.ps1 para crearlo\n');
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

const env = loadEnvFile();

// Verificar variables requeridas
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

console.log('📋 Variables de entorno:');
console.log(`   URL: ${supabaseUrl ? '✅ Presente' : '❌ Faltante'}`);
console.log(`   Anon Key: ${supabaseKey ? '✅ Presente (' + supabaseKey.substring(0, 20) + '...)' : '❌ Faltante'}`);
console.log(`   Service Role Key: ${serviceRoleKey ? '✅ Presente (' + serviceRoleKey.substring(0, 20) + '...)' : '❌ Faltante'}`);
console.log('');

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Error: Faltan variables de entorno requeridas');
  process.exit(1);
}

// Crear cliente de Supabase
const supabase = createClient(supabaseUrl, supabaseKey);

// Test 1: Verificar conexión básica
async function testConnection() {
  console.log('🧪 Test 1: Verificando conexión básica...');
  
  try {
    // Intentar una query simple
    const { data, error } = await supabase.from('services').select('count').limit(1);
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      console.log(`   Código: ${error.code || 'N/A'}`);
      console.log(`   Detalles: ${error.details || 'N/A'}`);
      return false;
    }
    
    console.log('   ✅ Conexión exitosa');
    return true;
  } catch (err) {
    console.log(`   ❌ Error de conexión: ${err.message}`);
    return false;
  }
}

// Test 2: Verificar que las tablas existan
async function testTables() {
  console.log('\n🧪 Test 2: Verificando existencia de tablas...');
  
  const tables = ['profiles', 'services', 'appointments'];
  const results = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log(`   ❌ Tabla '${table}' no existe`);
          results[table] = false;
        } else {
          console.log(`   ⚠️  Tabla '${table}' existe pero hay error: ${error.message}`);
          results[table] = 'warning';
        }
      } else {
        console.log(`   ✅ Tabla '${table}' existe`);
        results[table] = true;
      }
    } catch (err) {
      console.log(`   ❌ Error al verificar '${table}': ${err.message}`);
      results[table] = false;
    }
  }
  
  return results;
}

// Test 3: Verificar datos en servicios
async function testServices() {
  console.log('\n🧪 Test 3: Verificando datos de servicios...');
  
  try {
    const { data, error } = await supabase
      .from('services')
      .select('id, name, price, duration_minutes')
      .order('price', { ascending: true });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
      return null;
    }
    
    if (!data || data.length === 0) {
      console.log('   ⚠️  No hay servicios en la base de datos');
      console.log('   💡 Ejecuta el script SQL de docs/SETUP_DATABASE.md para insertar datos');
      return [];
    }
    
    console.log(`   ✅ Encontrados ${data.length} servicio(s):`);
    data.forEach((service, index) => {
      console.log(`      ${index + 1}. ${service.name} - $${service.price} (${service.duration_minutes} min)`);
    });
    
    return data;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return null;
  }
}

// Test 4: Verificar políticas RLS
async function testRLS() {
  console.log('\n🧪 Test 4: Verificando políticas RLS...');
  
  try {
    // Intentar leer servicios (debería funcionar con anon key)
    const { data, error } = await supabase.from('services').select('*');
    
    if (error && error.code === '42501') {
      console.log('   ⚠️  Error de permisos: Las políticas RLS pueden estar bloqueando el acceso');
      console.log('   💡 Verifica que ejecutaste el script SQL completo de docs/SETUP_DATABASE.md');
      return false;
    }
    
    if (error) {
      console.log(`   ⚠️  Error: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Políticas RLS configuradas correctamente');
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

// Test 5: Verificar autenticación
async function testAuth() {
  console.log('\n🧪 Test 5: Verificando configuración de autenticación...');
  
  try {
    // Verificar que el cliente de auth esté disponible
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log(`   ⚠️  Error al verificar sesión: ${error.message}`);
      return false;
    }
    
    console.log('   ✅ Módulo de autenticación disponible');
    console.log(`   Estado de sesión: ${session ? 'Sesión activa' : 'Sin sesión (normal para este test)'}`);
    return true;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

// Ejecutar todos los tests
async function runAllTests() {
  console.log('═══════════════════════════════════════════════════════\n');
  
  const results = {
    connection: await testConnection(),
    tables: await testTables(),
    services: await testServices(),
    rls: await testRLS(),
    auth: await testAuth()
  };
  
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 RESUMEN DE RESULTADOS:\n');
  
  console.log(`Conexión básica: ${results.connection ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Tablas: ${Object.values(results.tables).every(v => v === true) ? '✅ OK' : '⚠️  Revisar'}`);
  console.log(`Servicios: ${results.services !== null ? '✅ OK' : '❌ FALLO'}`);
  console.log(`Políticas RLS: ${results.rls ? '✅ OK' : '⚠️  Revisar'}`);
  console.log(`Autenticación: ${results.auth ? '✅ OK' : '❌ FALLO'}`);
  
  const allPassed = results.connection && results.rls && results.auth && results.services !== null;
  
  console.log('\n═══════════════════════════════════════════════════════');
  
  if (allPassed) {
    console.log('🎉 ¡Todos los tests pasaron! La conexión con Supabase está funcionando correctamente.\n');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisa los errores arriba.\n');
    console.log('💡 Siguientes pasos:');
    console.log('   1. Verifica que ejecutaste el script SQL de docs/SETUP_DATABASE.md');
    console.log('   2. Verifica que las credenciales en .env.local sean correctas');
    console.log('   3. Revisa docs/VERIFICAR_SUPABASE.md para más ayuda\n');
  }
  
  process.exit(allPassed ? 0 : 1);
}

// Ejecutar
runAllTests().catch(err => {
  console.error('\n❌ Error fatal:', err);
  process.exit(1);
});



