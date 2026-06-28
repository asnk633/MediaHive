async function checkPR() {
  const url = 'https://api.github.com/repos/asnk633/MediaHive/pulls?head=asnk633:feat/user-deactivation-cleanup';
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
    const pulls = await res.json();
    if (pulls.length === 0) {
      console.log('No open Pull Request found for branch feat/user-deactivation-cleanup');
      console.log('You can open a PR at: https://github.com/asnk633/MediaHive/compare/feat/user-deactivation-cleanup?expand=1');
      return;
    }
    console.log('Open Pull Requests:');
    pulls.forEach(pr => {
      console.log(`- PR #${pr.number}: "${pr.title}" (Status = ${pr.state}, URL = ${pr.html_url})`);
    });
  } catch (error) {
    console.error('Error fetching PRs:', error);
  }
}
checkPR();
