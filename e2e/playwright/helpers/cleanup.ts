import { Page } from '@playwright/test';

export function getTestPrefix(feature: string): string {
    return `test_${feature}_${Date.now()}_`;
}

export async function cleanupByPrefix(table: string, column: string, prefix: string) {
    console.log(`Cleanup: Delete from ${table} where ${column} like '${prefix}%'`);
    // Note: To implement a real cleanup, we would need to call an API endpoint or use direct DB access.
    // For now, returning a mock promise to satisfy TypeScript.
    return Promise.resolve();
}
