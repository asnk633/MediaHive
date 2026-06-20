const url = 'https://fcctcorycpvebupluzpe.supabase.co/rest/v1/files?select=name,drive_file_id,thumbnail_link,mime_type&name=ilike.*.pdf&limit=2';
const headers = {
  apikey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2NDU0MSwiZXhwIjoyMDg3ODQwNTQxfQ.zDaxBjE6yUAa44PeTTSrNDDcIdrgG_PFS35C1DBjSX4',
  Authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZjY3Rjb3J5Y3B2ZWJ1cGx1enBlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjI2NDU0MSwiZXhwIjoyMDg3ODQwNTQxfQ.zDaxBjE6yUAa44PeTTSrNDDcIdrgG_PFS35C1DBjSX4'
};
fetch(url, { headers }).then(r => r.json()).then(data => console.log(JSON.stringify(data, null, 2)));
