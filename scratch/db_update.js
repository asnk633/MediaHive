const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://fcctcorycpvebupluzpe.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2NDU0MSwiZXhwIjoyMDg3ODQwNTQxfQ.zDaxBjE6yUAa44PeTTSrNDDcIdrgG_PFS35C1DBjSX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const version = '1.1.3-beta+4030';
  const targetUrl = 'https://thaiba-garden-media-manager.vercel.app/MediaHive_V1.1.3-beta_4030.apk';
  
  console.log(`Syncing release metadata to Supabase system_config...`);
  console.log(`Latest Version: ${version}`);
  console.log(`Download Link: ${targetUrl}`);

  // Update app_latest_version
  const res1 = await supabase
    .from('system_config')
    .update({ value: version })
    .eq('key', 'app_latest_version')
    .select();

  if (res1.error) {
    console.error('Error updating app_latest_version:', res1.error);
  } else {
    console.log('Successfully updated app_latest_version:', res1.data);
  }

  // Update app_download_url
  const res2 = await supabase
    .from('system_config')
    .update({ value: targetUrl })
    .eq('key', 'app_download_url')
    .select();

  if (res2.error) {
    console.error('Error updating app_download_url:', res2.error);
  } else {
    console.log('Successfully updated app_download_url:', res2.data);
  }
}

run();
