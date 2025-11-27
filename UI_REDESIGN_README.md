# UI Redesign Implementation

## Overview

This document describes the new UI redesign components and how to toggle between the old and new interfaces.

## Components

### Design System
- `src/design-system/tokens.css` - Central design tokens
- `src/design-system/base.css` - Base styles and resets

### UI Components
- `src/components/ui/PageContainer.tsx` - Page layout wrapper
- `src/components/ui/BottomNav.tsx` - 6-item bottom navigation
- `src/client/components/FAB.tsx` - Floating Action Button with role-based menu

### Redesign Pages
- `src/app/(redesign)/home/page.tsx`
- `src/app/(redesign)/tasks/page.tsx`
- `src/app/(redesign)/events/page.tsx`
- `src/app/(redesign)/reports/page.tsx`
- `src/app/(redesign)/downloads/page.tsx`
- `src/app/(redesign)/profile/page.tsx`

## Feature Toggle

To enable the new UI, set the environment variable:

```
NEXT_PUBLIC_NEW_UI=true
```

## QA Checklist

### Visual Verification
- [ ] All redesign pages load without errors
- [ ] PageContainer provides consistent spacing and max-width
- [ ] BottomNav displays 6 items with proper styling
- [ ] FAB appears centered above BottomNav
- [ ] FAB menu opens and closes correctly
- [ ] FAB menu items display with proper colors and styling
- [ ] Design system tokens are applied consistently
- [ ] Typography follows the design system
- [ ] Spacing and padding use design system values

### Functionality
- [ ] BottomNav links navigate correctly
- [ ] FAB menu items navigate correctly
- [ ] FAB menu closes on Escape key press
- [ ] FAB menu items are keyboard accessible
- [ ] Role-based FAB menu works (admin sees "Notify" option)
- [ ] Feature toggle works as expected

### Responsiveness
- [ ] Layout adapts to different screen sizes
- [ ] BottomNav remains fixed at the bottom
- [ ] FAB remains centered above BottomNav
- [ ] Content scrolls properly within the page container

### Accessibility
- [ ] Proper ARIA attributes on navigation elements
- [ ] Semantic HTML structure
- [ ] Color contrast meets accessibility standards
- [ ] Keyboard navigation works correctly
- [ ] Focus states are visible