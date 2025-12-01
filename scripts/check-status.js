
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAppointmentStatus(id) {
    const { data, error } = await supabase
        .from('appointments')
        .select('id, status')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Estado de la cita:', data.status);
    }
}

checkAppointmentStatus('1493fd3e-fa05-442b9-a862-ab0f707ecae4');
