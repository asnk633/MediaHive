# Domain Boundaries & Module Contracts

To ensure the scalability and maintainability of MediaHive, we enforce strict domain boundaries. Modules must not have direct dependencies on the internal implementation of other modules.

## Architecture Guidelines

### 1. Module Contracts
Inter-domain communication must happen through centralized contracts located in `src/services/[domain]`.
- **Authoritative Services**: Each domain (Inventory, Tasks, Campaigns, etc.) has a dedicated service that acts as the sole entry point for data operations.
- **DTOs & Interfaces**: Shared types are defined in `[domain]Contract.ts` and exported for use by other modules.

### 2. Forbidden Dependencies
- `features/tasks` → `features/inventory` (FORBIDDEN)
- `components/tasks` → `api/inventory` (FORBIDDEN - Use `inventoryService` instead)

### 3. Layer Separation
- **Components**: Responsible for UI and local state. Call services to interact with data.
- **Services**: Responsible for data fetching, caching strategies, and mapping API responses to domain models.
- **System**: Global infrastructure (Auth, Workspace, Features).

## Example: Requesting Equipment from a Task

**Incorrect (Tight Coupling):**
```tsx
// Inside Task component
import { InventoryItem } from '@/types/inventory';
const items = await apiClient('/api/inventory');
```

**Correct (Decoupled via Contract):**
```tsx
// Inside Task component
import { inventoryService } from '@/services/inventory/inventoryService';
import { EquipmentItem } from '@/services/inventory/inventoryContract';

const items = await inventoryService.getEquipment();
```

## Maintenance
Periodically audit the codebase for cross-module imports using dependency graph tools or simple grep searches for `@/features` and `@/api` inside components of a different domain.
