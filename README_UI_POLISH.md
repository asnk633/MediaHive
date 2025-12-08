# UI Polish QA Checklist

This document outlines the quality assurance steps to verify the UI polish changes before merging.

## Prerequisites

- Ensure the development server is running (`npm run dev`)
- Ensure you're on the `polish/ui-institutional-pass` branch
- Have a modern browser ready for testing (Chrome, Firefox, Safari)

## QA Steps

### 1. Console and Hydration Check
- [ ] Start dev server and visit app root
- [ ] Open browser developer tools
- [ ] Verify no console errors or hydration warnings appear

### 2. Theme Toggle Verification
- [ ] Visit any page and locate the theme toggle in the top bar
- [ ] Toggle between light and dark modes
- [ ] Refresh the page and verify the theme persists
- [ ] Check that there is no flicker during page load
- [ ] Confirm `document.documentElement.dataset.theme` persists correctly

### 3. FAB Component Testing
- [ ] Navigate to the Tasks page
- [ ] Locate the FAB (Floating Action Button) at the bottom center
- [ ] Click the FAB to open the menu
- [ ] Verify menu items are reachable by Tab key
- [ ] Press Enter to activate links
- [ ] Verify labels are readable and properly aligned
- [ ] Test closing the menu with the Escape key
- [ ] Verify the FAB is centered and doesn't overlap BottomNav icons

### 4. Bottom Navigation Testing
- [ ] Navigate between different sections using BottomNav
- [ ] Verify the active item is clearly visible with proper styling
- [ ] Check that the FAB is centered and not overlapping any icons
- [ ] Verify all nav items have adequate touch targets (minimum 44x44px)

### 5. Tasks Page and Scrolling
- [ ] Go to the Tasks page
- [ ] Scroll down through a long list of cards
- [ ] Verify content is not clipped behind BottomNav
- [ ] Check that scrolling is smooth and responsive

### 6. Light Theme Contrast Check
- [ ] Switch to light theme using the toggle
- [ ] Navigate to various pages (Home, Tasks, Profile)
- [ ] Verify card contrast and shadows are readable
- [ ] Check that text maintains proper AA contrast ratio (>= 4.5:1)

### 7. Keyboard Navigation
- [ ] Disable mouse/trackpad and navigate using only keyboard
- [ ] Tab through top bar elements
- [ ] Tab through main content
- [ ] Tab to FAB and activate with Enter
- [ ] Verify focus is visible on all interactive elements
- [ ] Check that focus moves logically through the page

### 8. Mobile & Desktop Responsiveness
- [ ] Test on desktop browser at various screen sizes
- [ ] Test on mobile device or mobile emulator
- [ ] Verify FAB and BottomNav adapt correctly to screen size
- [ ] Check that typography scales appropriately

### 9. Page-Level Harmonization
- [ ] Check Home page for consistent heading styles and card padding
- [ ] Check Tasks page for consistent card styling and scroll behavior
- [ ] Check Calendar page for proper timeline styling and event cards
- [ ] Check Downloads page for consistent file item styling
- [ ] Check Profile page for proper account information layout
- [ ] Check Updates page for notification card consistency
- [ ] Check Reports page for metric card styling

### 10. Component Harmonization
- [ ] Verify FAB uses radius-lg and proper panel tokens
- [ ] Verify BottomNav uses correct panel tokens and spacing
- [ ] Verify TopBar uses icon tokens, not hardcoded text colors
- [ ] Verify all cards use `.card-padding` class

## Required Screenshots

Capture and attach the following high-resolution screenshots (1920×1080 or larger):

1. `Home_light.png` - Home page in light theme
2. `Home_dark.png` - Home page in dark theme
3. `Tasks_scroll.png` - Tasks page scrolled down showing many cards
4. `Calendar_light.png` - Calendar page in light theme
5. `Calendar_dark.png` - Calendar page in dark theme
6. `FAB_open_dark.png` - FAB open with menu items visible in dark theme
7. `FAB_open_light.png` - FAB open with menu items visible in light theme
8. `BottomNav_active.png` - BottomNav showing active state
9. `Profile_page.png` - Profile page showing account settings
10. `Notifications_composer.png` - Notifications composer page
11. `Tasks_composer.png` - Tasks composer page

## Optional Visual Verification

If available, record a short video/GIF showing:
- `a11y_tab_order.gif` - Keyboard-only navigation through the interface

## Visual Regression Testing

If visual regression tools are available:
1. Run snapshot comparison against baseline
2. Attach results as `visual-regression-diff.zip`

## Test Commands

Run the UI polish smoke tests:
```bash
npm run test:e2e ui/polish.spec.ts
```

## Acceptance Criteria

Before merging, ensure all of the following criteria are met:

- [ ] No added runtime errors or hydration warnings
- [ ] All functionality is preserved
- [ ] UI appears consistent in both light and dark modes with tokens
- [ ] FAB is centered, accessible, and menu labels are readable
- [ ] BottomNav has consistent spacing and active state
- [ ] All UI polish smoke tests pass in CI
- [ ] All screenshots captured and attached to PR
- [ ] Token usage is consistent across all components and pages
- [ ] CSS remains performant and minimal
- [ ] No breaking changes or layout regressions

## Rollback Plan

If issues are discovered after merge:

1. Revert the PR branch with GitHub revert (one-click revert)
2. This will restore previous CSS and components
3. Re-run tests and re-open isolated tasks with failing components
4. If revert fails, use: `git checkout main && git reset --hard <previous-commit-sha>` then force-push branch, and redeploy

## Changes Summary

This UI polish includes:

- Centralized design tokens for consistent theming
- Normalized typography and spacing across all pages
- Strengthened light-mode panel contrast and reduced FAB neon effect
- Improved accessibility with focus rings and keyboard navigation
- Enhanced micro-animations for smoother interactions
- Refined FAB and BottomNav components
- Performance optimizations to reduce repaint triggers
- Comprehensive test coverage for UI components
- Page-level harmonization across all application pages
- Component harmonization for consistent styling