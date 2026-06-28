async function getFailedJobLogs() {
  const runId = '27873225777'; // Build & Test
  const urlJobs = `https://api.github.com/repos/asnk633/MediaHive/actions/runs/${runId}/jobs`;
  try {
    const resJobs = await fetch(urlJobs, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const dataJobs = await resJobs.json();
    const failedJob = dataJobs.jobs.find(j => j.conclusion === 'failure');
    if (!failedJob) {
      console.log('No failed job found.');
      return;
    }
    console.log(`Failed job found: ${failedJob.name} (ID: ${failedJob.id})`);
    
    // Fetch logs
    const urlLogs = `https://api.github.com/repos/asnk633/MediaHive/actions/jobs/${failedJob.id}/logs`;
    const resLogs = await fetch(urlLogs, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const logText = await resLogs.text();
    // Print the last 50 lines of the log
    const lines = logText.split('\n');
    console.log('--- Failed Job Logs (Last 80 lines) ---');
    console.log(lines.slice(-80).join('\n'));
  } catch (error) {
    console.error('Error fetching logs:', error);
  }
}
getFailedJobLogs();
