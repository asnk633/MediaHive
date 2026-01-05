const getPort = require("get-port");

async function findAvailablePort(fallback = 3000) {
  try {
    // Try to find a port, prioritizing the fallback (3000)
    const port = await getPort.default({ port: fallback });
    return port;
  } catch (error) {
    console.error("Error finding available port:", error);
    return fallback + 1;
  }
}

module.exports = { findAvailablePort };