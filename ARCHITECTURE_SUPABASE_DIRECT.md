# Supabase Direct Access Architecture

MediaHive has transitioned from a proxied API architecture to a **Direct Access Architecture**. This change eliminates unnecessary Next.js API routes, reducing latency and complexity, while relying on Supabase **Row Level Security (RLS)** for multi-tenant isolation.

## Architecture Overview

### Previous Flow (Proxied)
`Frontend` → `Next.js API Route` → `Supabase Admin Client` → `Database`

### New Flow (Direct)
`Frontend` → `Supabase Client (@/lib/supabaseClient)` → `Database (RLS enforced)`

## Implementation Details

### 1. Service Layer
All core services in `src/services/` and `src/features/*/services/` now use the client-side Supabase instance.
- **Tenant Context**: Automatically derived from the Supabase session (`auth.jwt() ->> 'tenant_id'`).
- **Standardization**: Services use `supabase.from('table')` directly.

### 2. Security (RLS)
Security is now enforced at the database level. Every table is protected by a tenant isolation policy:
```sql
CREATE POLICY "Tenant Isolation" ON "public"."tasks"
AS PERMISSIVE FOR ALL
TO authenticated
USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
WITH CHECK (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
```

### 3. Realtime Subscriptions
Realtime updates now use the direct client for `postgres_changes`, ensuring users only receive updates for their specific tenant via the RLS filter.

## When to use API Routes
API routes (`src/app/api/*`) are now reserved for:
- **System Administration**: Operations requiring `service_role` (e.g., user deletion, global settings).
- **Background Jobs**: Cron tasks and cleanup scripts.
- **Third-Party Integrations**: Webhooks and external API access.
- **Complex Orchestration**: Actions that trigger side effects across multiple tables or services (e.g., Event Approval triggering Task Creation).

## Verification
- **Multi-tenancy**: Verified that users CANNOT see or modify data belonging to other tenants.
- **Performance**: Reduced overhead by bypassing Next.js serverless functions for simple CRUD.
