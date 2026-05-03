import { supabase } from '@/lib/supabaseClient';
import { TABLES, TableName } from '@/lib/dbTables';

/**
 * Standardized Tenant Query Wrapper
 * Ensures every query is automatically scoped to the provided tenant_id.
 * 
 * @param table - The database table name to query (use TABLES constant)
 * @param tenantId - The UUID of the tenant
 * @returns A Supabase query builder scoped to the tenant
 */
export function tenantQuery(table: TableName, tenantId: string) {
    if (!tenantId) {
        throw new Error(`[TenantQuery] Attempted to query table "${table}" without a valid tenantId.`);
    }

    return supabase
        .from(table)
        .select('*')
        .eq('tenant_id', tenantId);
}

/**
 * Standardized Tenant Operation Wrapper
 * Returns the raw query builder for manual control over select/insert/update/delete.
 * 
 * @param table - The database table name (use TABLES constant)
 * @returns PostgrestQueryBuilder
 */
export function fromTable(table: TableName) {
    return supabase.from(table);
}
