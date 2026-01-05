# Device Request & Usage Logging Design

## 1. Overview
This module enables Team Members and Guests to request equipment. It enforces a strict lifecycle managed by Admins (Approve -> Issue -> Return) to ensure every usage event is logged with condition reports, preventing "off-the-books" lending.

## 2. Requirements
*   **Roles**:
    *   **Guest**: Can request devices (Generic Description/Category).
    *   **Team**: Can request devices (Specific Item or Generic).
    *   **Admin**: Approves requests, Issues items (assigning specific Asset ID), and processes Returns.
*   **Logging**: Automatic creation of usage logs.
*   **Condition Tracking**: Log condition at Issue and Return.
*   **Inventory Link**: Must update inventory availability status.

## 3. Data Models

### Inventory Updates
We need to add a status field to `InventoryItem`.
```typescript
// Update to src/types/inventory.ts
export type InventoryStatus = 'available' | 'in_use' | 'maintenance' | 'retired';

interface InventoryItem {
  // ... existing fields
  status: InventoryStatus; // New field
  currentHolder?: {        // New field (denormalized for quick views)
     uid: string;
     name: string;
     requestId: string;
  };
}
```

### Device Request (`device_requests`)
Represents the user's intent to borrow something.
```typescript
interface DeviceRequest {
  id: string;
  requester: {
    uid: string;
    name: string;
    role: 'team' | 'guest' | 'admin';
  };
  
  // What they want
  itemCategory: string; // e.g., "Camera"
  requestedItemId?: string; // Optional (Team might know exactly what they want)
  description?: string; // e.g., "Need the wide lens for a shoot"
  
  // Duration
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Lifecycle
  status: 'pending' | 'approved' | 'issued' | 'returned' | 'rejected' | 'cancelled';
  
  // Admin Decisions
  assignedItemId?: string; // The actual item given
  adminNotes?: string;
  
  // Timestamps
  createdAt: Timestamp;
  updatedAt: Timestamp;
  issuedAt?: Timestamp;
  returnedAt?: Timestamp;
}
```

### Device Log (`device_logs`)
An immutable audit trail. One request = One Log Entry (usually).
```typescript
interface DeviceLog {
  id: string;
  requestId: string;
  inventoryItem: {
    id: string;
    name: string;
    serialNumber?: string;
  };
  user: {
    uid: string;
    name: string;
  };
  
  issuedAt: Timestamp;
  expectedReturnAt: Timestamp;
  returnedAt?: Timestamp;
  
  conditionOnIssue: InventoryCondition;
  conditionOnReturn?: InventoryCondition;
  
  issuedBy: string; // Admin UID
  receivedBy?: string; // Admin UID (who processed the return)
}
```

## 4. Permission Matrix

| Action | Admin | Team | Guest |
| :--- | :---: | :---: | :---: |
| **Create Request** | ✅ | ✅ | ✅ |
| **View Own Requests** | ✅ | ✅ | ✅ |
| **View All Requests** | ✅ | ❌ | ❌ |
| **Edit Request** | ✅ | ✅ (Own, if pending) | ✅ (Own, if pending) |
| **Cancel Request** | ✅ | ✅ (Own, if pending) | ✅ (Own, if pending) |
| **Approve/Reject** | ✅ | ❌ | ❌ |
| **Issue Item** | ✅ | ❌ | ❌ |
| **Return Item** | ✅ | ❌ | ❌ |

## 5. UI Flow

### A. Request Portal (Guest/Team)
*   **Entry**: "Request Device" button (FAB or Inventory Page).
*   **Form**:
    *   Category (Dropdown).
    *   Specific Item (Dropdown - *Team Only*).
    *   Start/End Date (Date Picker).
    *   Purpose/Notes.
*   **Dashboard**: "My Requests" tab under `Profile` or a dedicated `Requests` item in BottomNav (Admin only?). 
    *   *Correction*: Guests need to see their status. We might need a `Requests` page accessible to all, but filtered.

### B. Admin Dashboard (Inbox)
*   **Route**: `/admin/requests` (or shared `/requests` showing all for Admin).
*   **Tabs**: Pending, Active (Issued), History.
*   **Actions**:
    *   **On Pending**: Approve (Select specific item if not set), Reject.
    *   **On Approved**: Issue (Confirm condition, handing over). -> Changes status to `issued`, creates `DeviceLog`, updates `InventoryItem.status`.
    *   **On Issued**: Return (Input condition). -> Changes status to `returned`, updates `DeviceLog`, updates `InventoryItem.status` (to available or maintenance).

## 6. Lifecycle & Side Effects

1.  **Request Created**: Status `pending`.
2.  **Approve**: Status `approved`. Item is reserved? Not strictly, but Admin sees it.
3.  **Issue (Admin Action)**:
    *   Check Inventory `status`. If `in_use`, block.
    *   Update Request `status` -> `issued`.
    *   Update Inventory `status` -> `in_use`, `currentHolder` -> Requester.
    *   Create `DeviceLog`.
    *   *Constraint*: Can't issue without selecting a valid Inventory Item.
4.  **Return (Admin Action)**:
    *   Input `conditionOnReturn`.
    *   Update Request `status` -> `returned`.
    *   Update Inventory `status` -> `available` (or `maintenance` if condition bad).
    *   Update `DeviceLog` with `returnedAt`, `conditionOnReturn`.

## 7. Conflicts & Risks
*   **Inventory Visibility**: Guests can't see the inventory list to pick items.
    *   *Solution*: Guests request by **Category/Description**. Admin fulfills.
*   **Double Booking**: System doesn't strictly prevent overlapping "bookings" in the future, it only blocks "Issuing" if currently `in_use`.
    *   *Mitigation*: Admin's responsibility to check dates in Phase 1.
*   **Tasks Integration**: Future link: A Task might auto-generate a generic Device Request. (Out of scope for now).

## 8. Implementation Plan
1.  **Update Types**: Modify `InventoryItem` locally, create `DeviceRequest` and `DeviceLog` types.
2.  **Services**: `requestService` (CRUD for requests), `transactionService` (Atomic Issue/Return logic).
3.  **UI - Public**: Request Form, My Requests List.
4.  **UI - Admin**: Request Management Console (Issue/Return flows).
5.  **Rules**: Update Firestore rules for `device_requests`, `device_logs`.
