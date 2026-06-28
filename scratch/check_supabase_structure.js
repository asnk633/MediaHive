const fs = require('fs');
const dotenv = require('dotenv');

const envConfig = {
    ...dotenv.parse(fs.readFileSync('.env.local.backup'))
};

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL || envConfig.SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

async function checkStructure() {
    console.log('Fetching institutions...');
    const instUrl = `${supabaseUrl}/rest/v1/institutions?select=*`;
    const instRes = await fetch(instUrl, {
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        }
    });
    console.log('Institutions Response Status:', instRes.status);
    const instData = await instRes.json();
    console.log('Institutions:', JSON.stringify(instData, null, 2));

    console.log('\nFetching departments...');
    const deptUrl = `${supabaseUrl}/rest/v1/departments?select=*`;
    const deptRes = await fetch(deptUrl, {
        headers: {
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`
        }
    });
    console.log('Departments Response Status:', deptRes.status);
    const deptData = await deptRes.json();
    console.log('Departments:', JSON.stringify(deptData, null, 2));
}

checkStructure().catch(console.error);
