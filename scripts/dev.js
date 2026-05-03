const { findAvailablePort } = require("./findAvailablePort");
const { spawn, execSync } = require("child_process");

(async () => {
  // ── Architecture Health Check ──────────────────────────────────────
  try {
    console.log("Running Architecture Health Check...");
    execSync('npx tsx scripts/architectureHealth.ts', { stdio: 'inherit' });
  } catch (e) {
    console.warn('\n⚠️ Architecture health issues found. Please review the report above.');
  }

  // ── Route & Navigation Health Check ────────────────────────────────────────
  try {
    execSync('npx tsx scripts/healthCheck.ts', { stdio: 'inherit' });
  } catch (e) {
    // Non-fatal — warnings already printed by the script itself
  }

  // Run Schema Validation Check
  try {
    console.log("Checking database schema alignment...");
    execSync('npx tsx scripts/checkSchema.ts', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Schema validation warning (non-fatal):', e.message);
  }

  // Ensure middleware is enabled (in case a build script left it disabled)
  try {
    const { execSync } = require('child_process');
    execSync('node scripts/toggle-middleware.js enable', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Failed to restore middleware:', e.message);
  }

  console.log("DEV.JS API =", process.env.NEXT_PUBLIC_API_URL);
  // In CI, use fixed port 3000 to match Playwright config
  // Otherwise, find an available port for local development
  // Force port 3000 to avoid confusion
  const port = 3000;

  console.log(`Dev server starting on port ${port}...`);

  // Spawn next dev with proper args
  // On Windows, npx requires shell to be enabled
  const isWindows = process.platform === 'win32';
  const child = spawn('npx', ['next', 'dev', '-p', port.toString()], {
    stdio: 'inherit',
    shell: isWindows // Enable shell on Windows, disable on Unix for security
  });

  child.on('error', (err) => {
    console.error('Failed to start dev server:', err);
    process.exit(1);
  });

  child.on("exit", (code) => process.exit(code));
})();