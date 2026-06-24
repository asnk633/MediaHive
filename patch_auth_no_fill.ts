import fs from 'fs';

const authFile = 'e2e/playwright/helpers/auth.ts';
let content = fs.readFileSync(authFile, 'utf8');

// The e2e mock bypass immediately logs us in, so we don't need to fill the forms or click the submit button.
// And it redirects automatically if auth state changes, or we can just redirect explicitly.
content = content.replace(
  /await page.fill\('input\[placeholder="media@thaibagarden\.com"\], input\[type="email"\]', email\);\s*await page.fill\('input\[placeholder="••••••••••••"\], input\[type="password"\]', password\);\s*await page.click\('button\[type="submit"\]'\);/g,
  `
  // We mock authentication via localStorage, so no need to fill the form.
  // Instead, just navigate to the home page or trigger reload if needed.
  `
);

fs.writeFileSync(authFile, content);
