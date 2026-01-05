# Inventory Management Module Design

## 1. Overview
This module provides a system for tracking physical assets. It allows Admins to manage the inventory (CRUD) while restricting Team members to read-only access and blocking Guests entirely. The module is designed to be independent of the existing Task/Event systems for now but ready for future integration.

## 2. Requirements
*   **Roles & Permissions**:
    *   **Admin**: Full access (Create, Read, Update, Delete).
    *   **Team**: Read-only access (View list and details).
    *   **Guest**: No access.
*   **Data Scope**: Name, Category, Purchase Date, Purchase Price, Condition, Serial Number (Optional), Remarks.
*   **Independence**: Zero coupling with `Tasks` or `Events` in Phase 1.

## 3. Data Model

### Interface: `InventoryItem`
Defined in `src/types/inventory.ts`

```typescript
import { Timestamp } from 'firebase/firestore';

export type InventoryCondition = 'good' | 'needs_repair' | 'broken' | 'lost' | 'retired';

export interface InventoryItem {
  id: string;
  name: string;
  category: string; // Open string or predefined list (e.g., Camera, Lens, Audio, Lights, Cables, IT, Furniture)
  purchaseDate: Timestamp; 
  purchasePrice: number;
  condition: InventoryCondition;
  serialNumber?: string;
  remarks?: string;
  
  // Audit Fields
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: {
    uid: string;
    name: string;
  };
}
```

## 4. Permission Matrix

| Action | Admin | Team | Guest |
| :--- | :---: | :---: | :---: |
| **View List** | ✅ | ✅ | ❌ |
| **View Details** | ✅ | ✅ | ❌ |
| **Create Item** | ✅ | ❌ | ❌ |
| **Edit Item** | ✅ | ❌ | ❌ |
| **Delete Item** | ✅ | ❌ | ❌ |

### Security Rules Strategy
Since the current Firestore rules are open (`allow read, write: if isAuth()`), we rely on **client-side enforcement** for UI hiding and validation in the first pass, but I strongly recommend updating `firestore.rules` to lock this collection down specifically:

```javascript
match /inventory/{itemId} {
  // Allow read if user is Admin or Team
  allow read: if request.auth != null && 
    (get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['admin', 'team']);
    
  // Allow write only if Admin
  allow write: if request.auth != null && 
    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
}
```
*Note: This assumes the `users` collection is the source of truth for roles.*

### Deletion Policy
Deletion should ideally be treated as a "soft delete" (marking as `retired`) rather than a hard database removal to preserve historical data. For Phase 1, the "Delete" action in UI may perform a hard delete, but the design intent is to move towards `retired` status for tracking lifecycle.

## 5. UI Design & Entry Points

### Entry Point
*   **Location**: `BottomNavigation`
*   **Icon**: `Package` (Lucide React)
*   **Route**: `/inventory`
*   **Placement**: Added between `Events` and `Files` (or replacing `Spacer` if we shift FAB logic, but essentially becoming a core tab).

### Page Flow
1.  **Inventory List** (`/inventory`)
    *   Header: "Inventory" title + "Add Item" button (Admin only).
    *   Filter: By Category (Dropdown).
    *   Content: Grid or List of cards showing item summary (Name, Category, Status Badge).
    *   Empty State: "No items found".

2.  **Item Details** (`/inventory/[id]`)
    *   Full page view.
    *   Displays all fields.
    *   Action Bar (Admin only): "Edit", "Delete".

3.  **Add/Edit** (`/inventory/new`, `/inventory/[id]/edit`)
    *   Form with validation.
    *   Date picker for Purchase Date.
    *   Select for Condition.
    *   Number input for Price.

## 6. Side Effects & Risks
*   **Navigation Crowding**: Adding a 7th item (plus space) to BottomNav might be tight on small screens.
    *   *Mitigation*: Ensure strictly responsive sizing or horizontal scroll (though scroll is bad for nav). Current Nav handles width dynamically. We should verify 6-7 items fit.
*   **Role Latency**: New users might have latency in role propagation. standard AuthContext handling applies.

## 7. Implementation Plan
1.  **Setup Types**: Create `src/types/inventory.ts`.
2.  **Service Layer**: Create `src/services/inventoryService.ts` for Firestore ops.
3.  **Navigation**: Update `BottomNavigation.tsx` to include the route.
4.  **Pages**:
    *   Implement List Page.
    *   Implement Detail Page.
    *   Implement Form Page.
5.  **Review**: Verify permissions on each page.
