import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function probeTasks() {
    console.log('--- Probing tasks ---');
    const { error } = await supabase
        .from('tasks')
        .insert({
            title: 'Probe',
            description: 'Probe',
            priority: 'medium',
            due_date: new Date().toISOString(),
            status: 'todo',
            created_by: 'some-uid',
            institution_id: 1,
            department_id: 1,
            tenant_id: 1,
            type: 'general',
            is_archived: false,
            deleted: false,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.log('Error found:');
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS: Table is perfectly aligned.');
    }
}

async function probeEvents() {
    console.log('--- Probing events ---');
    const { error } = await supabase
        .from('events')
        .insert({
            title: 'Probe',
            description: 'Probe',
            start_at: new Date().toISOString(),
            end_at: new Date().toISOString(),
            approval_status: 'pending',
            status: 'upcoming',
            media_coverage: [],
            institution_id: 1,
            department_id: 1,
            tenant_id: 1,
            created_by: { uid: 'some-uid' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.log('Error found:');
        console.log(JSON.stringify(error, null, 2));
    } else {
        console.log('SUCCESS: Table is perfectly aligned.');
    }
}

async function run() {
    await probeTasks();
    await probeEvents();
}

run();
