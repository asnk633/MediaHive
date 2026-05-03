# Workspace Context System

The Workspace System transforms MediaHive into a multi-tenant aware application, allowing users to switch between different institutions (workspaces) within their tenant context.

## Architecture

The system consists of several layers:

### 1. WorkspaceProvider
Located at `src/system/workspace/WorkspaceProvider.tsx`, this context provider manages the global workspace state.
- **Persistence**: Selections are saved to `localStorage` under `mediahive_workspace`.
- **Auto-Selection**: On initial load, it selects the last-used workspace, the user's default institution, or the first available workspace.
- **Hook**: Use `useWorkspace()` to access `currentWorkspace` and `availableWorkspaces`.

### 2. API Integration
The `apiClient` (`src/lib/apiClient.ts`) automatically intercepts outgoing requests and appends `institution_id` to the query string if a workspace is active. This ensures data isolation at the API level without boilerplate in every service.

### 3. Data Revalidation
Feature hooks and components (e.g., `useTasks`, `InventoryView`) are registered to the workspace context. Switching workspaces triggers a re-fetch of all relevant data to ensure the UI stays in sync.

## Usage for Developers

### Accessing Workspace
```tsx
const { currentWorkspace } = useWorkspace();
console.log(currentWorkspace.institution_id);
```

### Manual Access (Dev Console)
For troubleshooting, the current state can be inspected via:
```javascript
window.workspace.get();
```

### Adding to New Features
When creating a new feature:
1. Wrap your `useQuery` key with the workspace ID: `['my-feature', workspaceId]`.
2. The `apiClient` will handle the server-side filtering automatically via the injected query parameter.
