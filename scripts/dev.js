const { findAvailablePort } = require("./findAvailablePort");
const { spawn } = require("child_process");

(async () => {
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