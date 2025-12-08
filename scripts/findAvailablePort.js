const getPort = require("get-port");

async function findAvailablePort(fallback = 3000) {
  try {
    // Try to find a port in a range starting from fallback
    const port = await getPort.default({ port: getPort.portNumbers(fallback, fallback + 100) });
    return port;
  } catch (error) {
    console.error("Error finding available port:", error);
    return fallback + 1;
  }
}

module.exports = { findAvailablePort };