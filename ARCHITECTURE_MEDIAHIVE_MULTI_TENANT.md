# MediaHive Multi-Tenant Architecture

This document outlines the scalable Multi-Tenant Architecture implemented in MediaHive, ensuring strict tenant isolation, performance, and clear data hierarchy for thousands of institutions and users.

## 1. Core Data Hierarchy

MediaHive follows a strict hierarchical structure for data organization:

1. **Tenant (Organization)**: The top-level administrative unit (represented by `tenant_id`).
2. **Institution**: A specific campus, branch, or entity within a tenant (represented by `institution_id`).
3. **Department / Unit**: Internal teams or functional areas within an institution (represented by `department_id` or `unit_id`).
4. **Users / Tasks / Events / Notifications / Inventory / Files**: Operational data scoped to the levels above.

### Rule: Single-Tenant Awareness
Every operational table MUST contain a `tenant_id` UUID column. This allows for absolute isolation at the query level.

## 2. Shared Operational Schema

All operational tables are standardized with the following metadata columns:

*   `tenant_id`: `UUID NOT NULL`. Primary isolation key.
*   `created_by`: `UUID`. Reference to the user who created the record.
*   `created_at`: `TIMESTAMP`. Creation record.
*   `updated_at`: `TIMESTAMP`. Last modification record.

## 3. Security Model: Supabase RLS

Security is enforced at the database level using Supabase Row Level Security (RLS).

### Tenant Isolation Policy
RLS policies use the `tenant_id` claim from the user's JWT to restrict access:

```sql
-- Standard Select Policy
CREATE POLICY "Tenant Isolation: Select" ON "public"."tasks"
FOR SELECT USING (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
);

-- Standard Insert Policy (Derived from JWT)
CREATE POLICY "Tenant Isolation: Insert" ON "public"."tasks"
FOR INSERT WITH CHECK (
  tenant_id = (auth.jwt() ->> 'tenant_id')::uuid
  AND auth.uid() = created_by
);
```

### Direct Access Strategy
MediaHive adopts the **Supabase Direct Access pattern**. The frontend interacts directly with the Supabase PostgREST API.
*   **Benefits**: Lower latency, reduced backend complexity, automatic RLS enforcement, and built-in Realtime support.
*   **Exceptions**: Specialized API routes are retained ONLY for complex administrative actions (e.g., bulk reassignments) or third-party integrations.

## 4. Developer API: `tenantContext` & `tenantQuery`

To simplify development and ensure isolation, all services utilize the `tenantContext.ts` and `tenantQuery.ts` helpers:

```typescript
import { tenantContext } from '@/lib/auth/tenantContext';
import { tenantQuery } from '@/lib/db/tenantQuery';

const { tenantId, userId } = await tenantContext();

// Standardized scoped query
const { data, error } = await tenantQuery('tasks', tenantId)
  .eq('status', 'todo');
```

The `tenantQuery` utility automatically injects the `.select('*').eq('tenant_id', tenantId)` clause, reducing boilerplate and ensuring that developers never forget the tenant filter.

## 5. Performance & Optimization

### Strategic Indexing
To support scaling to thousands of tenants, every table is indexed by `tenant_id`.
*   **Compound Indexes**: Common query patterns (e.g., `(tenant_id, institution_id, created_at)`) are indexed to ensure sub-100ms response times even with millions of rows.

### Realtime Subscriptions
Realtime subscriptions are filtered by `tenant_id` on initialize:
```typescript
supabase
  .channel('multi-tenant-channel')
  .on('postgres_changes', { 
    event: '*', 
    table: 'tasks', 
    filter: `tenant_id=eq.${tenantId}` 
  }, (payload) => { ... })
  .subscribe();
```

## 6. Observability & Logging

Operational integrity is monitored via structured logging across:
*   Authentication lifecycle.
*   Tenant context resolution.
*   Database operation latency and errors.
*   RLS violations.
