export function getTestPrefix(prefix: string) {
    return `${prefix}-${Date.now()}`;
}

export async function cleanupByPrefix(collection: string, field: string, prefix: string) {
    // Ideally this would interact with DB to cleanup
    console.log(`Cleanup ${collection} where ${field} starts with ${prefix}`);
}
