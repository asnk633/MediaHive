# Research: MediaHive Core Architecture

## Decided Architectural Approaches

### 1. Capacitor Absolute Path Resolution
* **Decision**: Prepend `apiClient` base URL dynamically on Capacitor shells.
* **Rationale**: Bypasses the relative route limitation inside native device wrappers (`localhost`).
* **Alternatives Considered**: Direct relative `/api/...` calls (rejected as they default to device filesystem and return 404).

### 2. Token Refresh during Sync
* **Decision**: Force token checks and `auth.refreshSession()` invocations before syncing local data.
* **Rationale**: REST requests bypass the default client auth wrapper, meaning expired tokens trigger silent failures after 1 hour.
* **Alternatives Considered**: Standard HTTP calls without checks (rejected due to 401 token expiry failures).

### 3. Tenant RLS Verification
* **Decision**: Restrict query results where table `tenant_id` equals manager's `tenant_id`.
* **Rationale**: Protects sensitive employee and work session data from being compromised by other tenant managers.
* **Alternatives Considered**: Role checks only (rejected as managers could query records of other organizations).
