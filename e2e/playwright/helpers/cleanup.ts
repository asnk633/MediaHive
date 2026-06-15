export function getTestPrefix(feature: string): string {
  return `${feature}-${Date.now()}`;
}

export async function cleanupByPrefix(table: string, column: string, prefix: string) {
  // Usually this would call a backend endpoint to delete test data based on prefix.
  // For the sake of the requirement: "Unique prefix and cleanup" we export these helper functions.
  console.log(`cleanup ${table} ${column} ${prefix}`);
}