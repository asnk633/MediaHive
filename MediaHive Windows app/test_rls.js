const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const headers = {
  apikey: supabaseKey,
  Authorization: `Bearer ${supabaseKey}`,
  'Content-Type': 'application/json'
};

async function runTests() {
  console.log('Testing Supabase DB access via REST API...');
  
  // Test read access to invitations
  console.log('\n--- Testing "invitations" table SELECT (Anonymous Access) ---');
  let res = await fetch(`${supabaseUrl}/rest/v1/invitations?select=*&limit=1`, { headers });
  if (!res.ok) {
    console.error('Expected error or failure accessing invitations anonymously:', res.status, res.statusText);
  } else {
    let data = await res.json();
    console.warn('WARNING: Anonymous user can read invitations:', data);
  }

  // Test read access to files
  console.log('\n--- Testing "files" table SELECT (Anonymous Access) ---');
  res = await fetch(`${supabaseUrl}/rest/v1/files?select=*&limit=1`, { headers });
  if (!res.ok) {
    console.error('Expected error or failure accessing files anonymously:', res.status, res.statusText);
  } else {
    let data = await res.json();
    console.warn('WARNING: Anonymous user can read files:', data);
  }

  // Try an insert on invitations
  console.log('\n--- Testing "invitations" table INSERT (Anonymous Access) ---');
  res = await fetch(`${supabaseUrl}/rest/v1/invitations`, { 
    method: 'POST',
    headers: { ...headers, 'Prefer': 'return=representation' },
    body: JSON.stringify({ tenant_id: '00000000-0000-0000-0000-000000000000', token: 'test-token', email: 'test@example.com' })
  });
  if (!res.ok) {
    console.error('Expected error inserting into invitations anonymously:', res.status, res.statusText);
  } else {
    let data = await res.json();
    console.warn('CRITICAL WARNING: Anonymous user can insert into invitations!', data);
  }
}

runTests();
