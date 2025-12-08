const { findAvailablePort } = require("./findAvailablePort");
const { spawn } = require("child_process");

(async () => {
  const port = await findAvailablePort(3000);
  
  console.log(`Dev server starting on port ${port}...`);

  const child = spawn("next", ["dev", "-p", String(port)], {
    stdio: "inherit",
    shell: true,
  });

  child.on("exit", (code) => process.exit(code));
})();