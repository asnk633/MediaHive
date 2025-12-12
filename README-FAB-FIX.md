# Layout & FAB Fixes

This update resolves layout issues with the Floating Action Button (FAB), Bottom Navigation, and Top Bar, ensuring consistent positioning across devices and Android WebView.

## Changes

1.  **Correct FAB Positioning**: 
    - The FAB is now explicitly positioned using a centralized calculation in `globals.css`:
      ```css
      bottom: calc(var(--bottom-nav-height) - (var(--fab-size) / 2) + 4px + env(safe-area-inset-bottom, 0px));
      ```
    - This ensures it overlaps the top edge of the Bottom Nav correctly and respects safe areas (e.g., iPhone Home indicator).

2.  **Android WebView Safety**:
    - Added specific `html.is-android-webview` overrides to prevent white flashes, fix missing checkbox styles, and simplify shadows/blurs for performance.
    - Used `position: fixed !important` and `z-index: 99999` to force visibility.

3.  **Sticky TopBar**:
    - `TopBar` is now `sticky` with proper `padding-top` safe-area awareness.
    - `globals.css` sets a dynamic `--topbar-height` variable.

4.  **Responsive Grid**:
    - The Tasks list is now a responsive grid (`sm:grid-cols-2`, `lg:grid-cols-3`) instead of a single column stack.

## Verification

### Automated Test
Run the new layout test:
```bash
npx playwright test tests/fab-position.spec.ts
```

### Manual Check
- **Mobile**: Verify FAB sits on the nav bar edge.
- **Desktop**: Verify FAB is centered and Bottom Nav items have labels.
- **WebView**: If possible, emulate `is-android-webview` class to check simplified styles.
