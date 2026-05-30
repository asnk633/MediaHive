const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    console.log('--- Querying Institutions with matching names ---');
    const { data: insts } = await supabase
        .from('institutions')
        .select('id, name')
        .or('name.ilike.%Director Office%,name.ilike.%Feed The Needy%');
    console.log('Institutions:', insts);

    console.log('\n--- Querying Departments with matching names ---');
    const { data: depts } = await supabase
        .from('departments')
        .select('id, name')
        .or('name.ilike.%Director Office%,name.ilike.%Feed The Needy%');
    console.log('Departments:', depts);

    console.log('\n--- Querying Task on_behalf_of, department_id, institution_id values ---');
    const { data: tasks } = await supabase
        .from('tasks')
        .select('id, title, on_behalf_of, department_id, institution_id')
        .eq('deleted', false);

    const occurrences = [];
    tasks.forEach(t => {
        let matched = false;
        const beh = t.on_behalf_of;
        const details = {
            id: t.id,
            title: t.title,
            on_behalf_of: beh,
            department_id: t.department_id,
            institution_id: t.institution_id
        };

        if (beh && (beh.name?.includes('Director Office') || beh.name?.includes('Feed The Needy'))) {
            matched = true;
        }
        
        if (t.department_id) {
            const d = depts.find(x => String(x.id) === String(t.department_id));
            if (d) matched = true;
        }

        if (t.institution_id) {
            const i = insts.find(x => String(x.id) === String(t.institution_id));
            if (i) matched = true;
        }

        if (matched) {
            occurrences.push(details);
        }
    });

    console.log('Matched task count:', occurrences.length);
    console.log('Matched tasks:', occurrences.slice(0, 15));
}
run();
