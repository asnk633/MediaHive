# UI Wiring Standards

**Effective Date:** 2025-12-28
**Scope:** All interactive UI elements in the application.

## 1. Destructive Actions Rule
Any UI element that performs a destructive action (Delete, Archive, Remove, Unlink) **MUST** adhere to the following protocol:

### 1.1 Client-Authoritative Deletion
*   **Source of Truth:** The Client SDK (Firebase) is the primary actor for deletion.
*   **API Usage:** APIs (`/api/events`) MUST NOT be relied upon for the actual deletion if the Client SDK is used. The API endpoint should be used for **Audit Logging** only, in a fire-and-forget manner.
*   **Idempotency:** Deletion logic normally handles "already deleted" cases gracefully, but double-calls (Client + API) causing 404s must be avoided.
*   **Pattern:**
    1.  `await deleteDoc(...)` (Client SDK)
    2.  `apiRequest('/audit', ...)` (Audit Log - optional/best-effort)

### 1.2 General Requirements

1.  **Service Wiring**: Must call a defined service method (e.g., `EventService.deleteEvent`). Direct database calls from UI components are prohibited.
2.  **Confirmation**: Must trigger a confirmation dialog (browser `confirm()` or custom modal) before execution.
3.  **Permission Gating**: Must check user permissions (Role or Ownership) before rendering the button or executing the action.
    *   *Admins*: Universal delete access.
    *   *Owners/Creators*: Delete access to own items.
    *   *Others*: Button should be hidden or disabled.
4.  **Optimistic UI + Rollback**: 
    *   UI should reflect the action immediately (e.g., close modal, remove item from list).
    *   If the backend call fails, the UI must gracefully rollback (toast error, restore item).

### Implementation Pattern (Controlled Modal)
All nested confirmation modals (e.g., inside other modals) MUST be fully controlled to prevent focus trapping deadlocks.

```typescript
// 1. Controlled State
const [isDeleteOpen, setIsDeleteOpen] = useState(false);

const confirmDelete = async () => {
    try {
        await Service.delete(id);
        
        // 2. Close Inner Modal FIRST
        setIsDeleteOpen(false);

        // 3. SAFE UNMOUNT: Use requestAnimationFrame
        // This ensures the focus trap is released and DOM is stable 
        // before the parent modal unmounts.
        requestAnimationFrame(() => {
            onClose(); 
        });
    } catch (e) {
        // Handle error, keep modal open
    }
};

// 4. Render
<AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
    {/* ... */}
</AlertDialog>
```

## 2. Interactive Element Auditing
*   **No Dead Buttons**: Every rendered button MUST have an `onClick` handler or be `disabled`.
*   **Development Warning**: Components should ideally verify that destructve actions are wired.
    *   *Recommendation*: Use `console.warn` in development if a critical action handler is undefined.

## 3. Storage Access
*   **Firestore-First**: NO direct calls to `firebase/storage` for rendering or deletion logic in UI components. All file operations should go through the Service Layer which manages Storage + Firestore synchronization.
