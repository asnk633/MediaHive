
import { supabase } from '../src/lib/supabaseClient';
import { TABLES } from '../src/lib/dbTables';

async function seedNotification() {
    // Get a user to notify
    const { data: profiles } = await supabase.from('profiles').select('id, tenant_id').limit(1);
    if (!profiles || profiles.length === 0) {
        console.error('No profiles found');
        return;
    }

    const user = profiles[0];

    const notification = {
        user_id: user.id,
        tenant_id: user.tenant_id,
        type: 'system_welcome',
        title: 'Welcome to MediaHive',
        body: 'Your notification system is now online. This is a diagnostic message.',
        priority: 'high',
        read: false,
        created_at: new Date().toISOString()
    };

    const { data, error } = await supabase.from(TABLES.NOTIFICATIONS).insert([notification]).select();

    if (error) {
        console.error('Error seeding notification:', error);
    } else {
        console.log('Seeded notification:', data);
    }
}

seedNotification();
