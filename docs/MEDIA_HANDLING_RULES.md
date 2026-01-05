# Media Handling Architecture Rules

**Status:** LOCKED (Phase 0 Audit Complete)
**Effective Date:** 2025-12-28

## Core Rule
**UI components must never import or access Firebase Storage for rendering media.**

Firebase Storage is strictly **UPLOAD-ONLY**. All rendering must use HTTPS URLs that are stored as strings in Firestore.

## Allowed Patterns

### 1. Rendering Avatars
- **DO NOT** call `getDownloadURL` or `ref(storage, ...)` in components.
- **DO NOT** use `getProfilePictureUrl` in rendering loops.
- **DO** use the `user.avatarUrl` property from the Auth Context (which is synced from Firestore).
- **DO** use the `SafeAvatar` component which handles fallbacks gracefully.

### 2. Rendering File Previews (Deliverables)
- When a file is uploaded, the backend/service must generating a signed/public URL.
- This URL must be saved to Firestore (e.g., in the `deliverables` collection).
- UI components must read the URL from Firestore and render it directly.

## Why this rule exists
1.  **Authorization & CORS**: Direct storage access often leads to complex CORS issues and authorization failures in diverse environments (WebView, Mobile).
2.  **Performance**: Fetching download URLs at render time causes waterfalls and layout shifts. Stored URLs allow instant rendering.
3.  **PWA/Offline Safety**: Stored URLs can be cached by service workers; dynamic storage refs cannot be reliably used offline without complex caching logic.
4.  **Stability**: Decoupling storage paths from rendering prevents broken images if internal storage paths change.

## Verification
Any new feature involving media (e.g., Deliverables v2.2) must pass this check:
- [ ] No `firebase/storage` imports in UI components.
- [ ] No `getDownloadURL` calls in UI components.
- [ ] Rendered `src` attributes always come from Firestore data.

## Violation Handling
If you find a violation:
1.  Refactor the upload flow to save the URL to Firestore.
2.  Update the UI to read from Firestore.
