const { findAvailablePort } = require("./findAvailablePort");
const { spawn } = require("child_process");

(async () => {
  // In CI, use fixed port 3000 to match Playwright config
  // Otherwise, find an available port for local development
  const port = process.env.CI ? 3000 : await findAvailablePort(3000);

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