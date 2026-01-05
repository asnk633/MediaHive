
import { type LibSQLDatabase } from 'drizzle-orm/libsql';
import { auditLog } from '@/db/schema';

/**
 * Converts an array of objects to CSV string.
 * @param data Array of data objects
 * @param columnsDefinition Mapping of Header Name to Data Key (or transformation function)
 */
export function convertToCSV<T>(
    data: T[],
    columns: { header: string; key: keyof T | ((item: T) => string | number | null | undefined) }[]
): string {
    if (!data || data.length === 0) return '';

    // 1. Header Row
    const headerRow = columns.map(c => `"${c.header.replace(/"/g, '""')}"`).join(',');

    // 2. Data Rows
    const rows = data.map(item => {
        return columns.map(col => {
            let val: any;
            if (typeof col.key === 'function') {
                val = col.key(item);
            } else {
                val = item[col.key];
            }

            if (val === null || val === undefined) {
                return '';
            }

            const strVal = String(val);
            // Escape quotes and wrap in quotes
            return `"${strVal.replace(/"/g, '""')}"`;
        }).join(',');
    });

    return [headerRow, ...rows].join('\n');
}

/**
 * Logs an export action to the audit log.
 * @param db Drizzle DB instance
 * @param user The admin user performing the action (must have id and tenantId)
 * @param resourceType The type of resource exported
 * @param resourceId Identifier for the resource (e.g., userId, Date Range)
 * @param format Export format (csv/json)
 * @param filters Additional filter details (period, dates, etc.)
 */
export async function logExportAction(
    db: LibSQLDatabase<any> | any, // Weak typing to avoid generic hell with schema
    user: { id: number; tenantId: number },
    resourceType: 'user_performance' | 'department_health' | 'attendance',
    resourceId: string,
    format: string,
    filters: Record<string, any>
) {
    try {
        await db.insert(auditLog).values({
            userId: String(user.id),
            action: 'export',
            resourceType,
            resourceId,
            details: JSON.stringify({ format, ...filters }),
            tenantId: user.tenantId,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Failed to log export audit:', error);
        // We do not throw, as audit failure should not necessarily block the read-only export 
        // (though in high security it might. For now, we log error).
    }
}
