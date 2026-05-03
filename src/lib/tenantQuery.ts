import { eq, SQL } from 'drizzle-orm';

/**
 * withTenant
 * 
 * A helper utility to enforce tenant scoping on Supabase queries.
 * Throws an error if tenantId is missing or invalid to prevent unsafe queries.
 * 
 * @param query The Supabase query builder object
 * @param tenantId The validated tenant UUID from verifyUser()
 * @returns The query builder with the tenant_id filter applied
 */
export function withTenant(
    query: any,
    tenantId: string | null | undefined
): any {
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        console.error('[TENANT GUARD] ❌ Attempted query without valid tenant context');
        throw new Error('Tenant context is required for this operation');
    }

    return query.eq('tenant_id', tenantId);
}

/**
 * isTenantScoped
 * 
 * A runtime check to ensure a tenantId is valid before using it in queries.
 */
export function validateTenant(tenantId: string | null | undefined): string {
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        throw new Error('Invalid tenant context');
    }
    return tenantId;
}
/**
 * withTenantDrizzle
 * 
 * A helper for Drizzle ORM queries to enforce tenant scoping.
 * 
 * @param table The Drizzle table object (must have a tenantId column)
 * @param tenantId The tenant ID (can be number or string)
 * @returns A Drizzle equality condition for the tenantId
 */
export function withTenantDrizzle(
    table: { tenantId: any },
    tenantId: string | number | null | undefined
): SQL {
    if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        console.error('[TENANT GUARD] ❌ Drizzle: Attempted query without valid tenant context');
        throw new Error('Tenant context is required for this operation');
    }

    // Handle string/number mismatch for SQLite vs Postgres
    const normalizedId = typeof tenantId === 'string' && !isNaN(Number(tenantId))
        ? Number(tenantId)
        : tenantId;

    return eq(table.tenantId, normalizedId as any);
}
