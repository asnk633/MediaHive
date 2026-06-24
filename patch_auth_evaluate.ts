import fs from 'fs';

const authFile = 'e2e/playwright/helpers/auth.ts';
let content = fs.readFileSync(authFile, 'utf8');

content = content.replace(
  /await page.evaluate\(\(\) => \{[\s\S]*?\}\);/g,
  `await page.evaluate((r) => {
    localStorage.clear();
    sessionStorage.clear();
    localStorage.setItem('playwright_test_auth', 'true');
    localStorage.setItem('playwright_test_role', r);
    localStorage.setItem('mediahive_onboarding_complete', 'true');
    localStorage.setItem('hasSeenMemberWelcome-v1', 'true');
  }, role);`
);

fs.writeFileSync(authFile, content);
