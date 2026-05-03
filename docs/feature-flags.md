# Feature Flag & Capability System

MediaHive uses a unified feature flagging system to manage access to components and modules based on user roles, workspace overrides, and global configuration.

## Core Concepts

### 1. Feature Registry
All feature flags are defined in `src/system/features/featureRegistry.ts`. Each entry specifies:
- `enabled`: Global default state.
- `minRole`: Minimum user role required to see/access the feature.
- `isLabs`: Boolean indicating if the feature is experimental.

### 2. Access Rank
Access is determined by the following priority (highest to lowest):
1. **Hard Role Gate**: If the user's role is below `minRole`, access is denied regardless of other settings.
2. **Workspace Override**: Individual institutions can enable or disable features via their `features` mapping in the database.
3. **Global Default**: The base state from the registry.

## Usage

### In React Components
Use the `canAccessFeature` function:

```tsx
import { canAccessFeature } from '@/system/features/featureAccess';

// ...
const hasAccess = canAccessFeature('aiAssistant', user.role, currentWorkspace);
```

### In Navigation
`DesktopSideNav.tsx` automatically filters groups and items using these flags. Adding `feature: 'featureKey'` to a nav item or group is sufficient.

## Developer Tools

You can inspect the active feature state for the current session in the browser console:

```javascript
// Lists all features and their computed access state
window.features.list();
```

## Available Flags
- `tasks`: Core task management.
- `events`: Calendar and event tracking.
- `inventory`: Media inventory access.
- `campaigns`: Marketing campaign management.
- `flowboard`: Kanban-style task board.
- `automationEngine`: Automation trigger system.
- `aiAssistant`: Smart assistant and LLM tools.
- `intelligenceDashboard`: Administrative audit and analytics.
- `labs`: Accessibility of the Laboratory group.
