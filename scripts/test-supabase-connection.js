const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

async function testConnection() {
    console.log('🔄 Iniciando prueba de conexión a Supabase...');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY');
        process.exit(1);
    }

    console.log(`📡 URL: ${supabaseUrl}`);
    // No mostramos la key completa por seguridad
    console.log(`🔑 Key configurada: ${supabaseKey ? 'Sí (***' + supabaseKey.slice(-4) + ')' : 'No'}`);

    try {
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data, error } = await supabase.from('services').select('count', { count: 'exact', head: true });

        if (error) {
            console.error('❌ Error al conectar con Supabase:', error.message);
            if (error.code === 'PGRST301') {
                console.error('   💡 Pista: Esto podría ser un problema de Row Level Security (RLS) o permisos.');
            }
            process.exit(1);
        }

        console.log('✅ ¡Conexión exitosa!');
        console.log(`📊 La conexión responde correctamente. (Status: OK)`);

    } catch (err) {
        console.error('❌ Error inesperado:', err);
        process.exit(1);
    }
}

testConnection();
