
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestAppointment() {
    // 1. Get a user (or create one if needed, but let's try to find one first)
    const { data: users } = await supabase.from('profiles').select('id').limit(1);

    let userId;
    if (users && users.length > 0) {
        userId = users[0].id;
    } else {
        console.log('No users found. Cannot create appointment without user.');
        return;
    }

    // 2. Get a service
    const { data: services } = await supabase.from('services').select('id').limit(1);
    if (!services || services.length === 0) {
        console.log('No services found.');
        return;
    }
    const serviceId = services[0].id;

    // 3. Create appointment
    const { data, error } = await supabase
        .from('appointments')
        .insert({
            client_id: userId,
            service_id: serviceId,
            start_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            status: 'pending'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating appointment:', error);
    } else {
        console.log('Cita creada:', data.id);
    }
}

createTestAppointment();
