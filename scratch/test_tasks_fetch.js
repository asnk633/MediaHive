const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Fetching Tasks via Supabase (Updated Query) ---');
    try {
        const { data, error } = await supabase
            .from('tasks')
            .select(`
                *,
                task_assignments(
                    user_id,
                    role,
                    profiles(id, full_name, avatar_url)
                ),
                creator:profiles!tasks_created_by_fkey(id, full_name, avatar_url, role, institution_id, department_id),
                updater:profiles!tasks_updated_by_fkey(id, full_name, avatar_url, role, institution_id, department_id),
                assigner:profiles!tasks_assigned_by_fkey(id, full_name, avatar_url, role, institution_id, department_id)
            `)
            .eq('deleted', false);

        if (error) {
            console.error('Database Error:', error);
            return;
        }

        console.log('Successfully fetched tasks. Count:', data.length);
        if (data.length > 0) {
            console.log('Sample Task title:', data[0].title);
            console.log('Sample Task created_at:', data[0].created_at);
            console.log('Sample Task creator:', data[0].creator);
        }
    } catch (e) {
        console.error('Fetch Exception:', e);
    }
}
run();
