const getPort = require("get-port");

async function findAvailablePort(fallback = 3000) {
  try {
    // Let get-port find any available port
    const port = await getPort.default();
    return port;
  } catch (error) {
    console.error("Error finding available port:", error);
    // Ultimate fallback - try to find a port in a range
    try {
      const port = await getPort.default({ port: getPort.makeRange(fallback, fallback + 100) });
      return port;
    } catch {
      // If all else fails, return fallback + 1
      return fallback + 1;
    }
  }
}

module.exports = { findAvailablePort };