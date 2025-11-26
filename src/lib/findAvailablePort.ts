import getPort from "get-port";

export async function findAvailablePort(fallback = 3000) {
  try {
    const port = await getPort({ port: fallback });
    return port;
  } catch {
    return fallback + 1;
  }
}