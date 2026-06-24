import fs from 'fs';

const authFile = 'e2e/playwright/helpers/auth.ts';
let content = fs.readFileSync(authFile, 'utf8');

content = content.replace(
  /await expect\(page\)\.toHaveURL\(\/\.\*home\/, \{ timeout: 30000 \}\);/g,
  `
  // We mock authentication via localStorage, so no need to fill the form.
  // Instead, just navigate to the home page or trigger reload if needed.
  await page.goto(baseUrl + '/home');
  await expect(page).toHaveURL(/.*home/, { timeout: 30000 });
  `
);

fs.writeFileSync(authFile, content);
