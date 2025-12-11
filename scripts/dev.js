const { findAvailablePort } = require("./findAvailablePort");
const { spawn } = require("child_process");

(async () => {
  // In CI, use fixed port 3000 to match Playwright config
  // Otherwise, find an available port for local development
  const port = process.env.CI ? 3000 : await findAvailablePort(3000);

  console.log(`Dev server starting on port ${port}...`);

  const child = spawn("next", ["dev", "-p", String(port)], {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => process.exit(code));
})();