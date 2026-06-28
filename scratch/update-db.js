const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase config in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const targetId = '1bRc-QPE58PJhOMlO-Ear2z6vD-L9MasW';
  // Copy the thumbnail URL from the working ENG brochure PDF
  const workingThumbnail = 'https://lh3.googleusercontent.com/drive-storage/AJQWtBN7NHvO266hKBqzNOKb_xWVLxobcjSFZtF66MdV785mGeNbuYIX78aMw7pv5efbL5i1-tvdQYLSnBSaWV7vFuxF5GJK_VqsqX2ZbMVKR6hergsj1g=s220';

  console.log(`Updating files with drive_file_id: ${targetId}...`);
  const { data, error } = await supabase
    .from('files')
    .update({ thumbnail_link: workingThumbnail })
    .eq('drive_file_id', targetId);

  if (error) {
    console.error('Update failed:', error);
  } else {
    console.log('Update successful! Rows updated successfully.');
  }
}

run();
