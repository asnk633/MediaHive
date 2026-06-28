async function checkFailedJobs() {
  const runId = '27565291254'; // Build & Test
  const url = `https://api.github.com/repos/asnk633/MediaHive/actions/runs/${runId}/jobs`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) {
      console.error(`Failed to fetch jobs: ${res.status} ${res.statusText}`);
      return;
    }
    const data = await res.json();
    console.log(`Jobs for Run ${runId}:`);
    data.jobs.forEach(job => {
      console.log(`- Job: ${job.name}, ID = ${job.id}, Status = ${job.status}, Conclusion = ${job.conclusion}`);
      if (job.conclusion === 'failure') {
        console.log(`  Steps failed:`);
        job.steps.forEach(step => {
          if (step.conclusion === 'failure') {
            console.log(`    * Step: ${step.name} (Status = ${step.status}, Conclusion = ${step.conclusion})`);
          }
        });
      }
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
  }
}
checkFailedJobs();
