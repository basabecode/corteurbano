require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function checkSchema() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('❌ Missing Supabase credentials in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🔍 Checking profiles table schema...');

    // Try to select telegram columns
    const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, telegram_chat_id, telegram_username, telegram_vinculado_at')
        .limit(5);

    if (error) {
        console.error('❌ Error selecting Telegram fields:', error.message);
        console.error('   This usually means the columns do not exist in the database.');
        return;
    }

    console.log('✅ Columns exist! Here are the first 5 rows:');
    console.table(data);

    // Check if any user has telegram_chat_id
    const { count, error: countError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .not('telegram_chat_id', 'is', null);

    if (countError) {
        console.error('Error counting users with telegram:', countError);
    } else {
        console.log(`\n📊 Users with Telegram linked: ${count}`);
    }
}

checkSchema();
