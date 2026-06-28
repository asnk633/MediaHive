async function checkCI() {
  const url = 'https://api.github.com/repos/asnk633/MediaHive/actions/runs?branch=main';
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) {
      console.error(`Failed to fetch: ${res.status} ${res.statusText}`);
      return;
    }
    const data = await res.json();
    if (!data.workflow_runs || data.workflow_runs.length === 0) {
      console.log('No workflow runs found for branch feat/user-deactivation-cleanup');
      return;
    }
    console.log('Recent Workflow Runs:');
    data.workflow_runs.slice(0, 5).forEach(run => {
      console.log(`- Run #${run.run_number} (${run.name}): Commit SHA = ${run.head_sha.substring(0, 9)}, Status = ${run.status}, Conclusion = ${run.conclusion}, Updated At = ${run.updated_at}`);
    });
  } catch (error) {
    console.error('Error fetching workflow runs:', error);
  }
}
checkCI();
