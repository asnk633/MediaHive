async function checkShaCI() {
  const sha = '9b184380d6dd9fa4927e08a123a115ddf3464df8';
  const url = `https://api.github.com/repos/asnk633/MediaHive/commits/${sha}/check-runs`;
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
    if (data.check_runs.length === 0) {
      console.log('No check runs registered yet for this commit SHA.');
      return;
    }
    console.log('Check Runs for current commit:');
    data.check_runs.forEach(run => {
      console.log(`- ${run.name}: Status = ${run.status}, Conclusion = ${run.conclusion}, URL = ${run.details_url}`);
    });
  } catch (error) {
    console.error('Error fetching checks:', error);
  }
}
checkShaCI();
