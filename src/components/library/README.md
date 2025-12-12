# Component Library

This directory contains the production-ready React + Tailwind components for the Thaiba Garden design system.

## 📂 Structure

### Atoms (`src/components/library/atoms/`)
*   **[Button.tsx](./atoms/Button.tsx)**: Main button component with `primary`, `secondary`, `ghost`, `danger` variants.

### Molecules (`src/components/library/molecules/`)
*   **[OverviewCard.tsx](./molecules/OverviewCard.tsx)**: Stat card used on the Home dashboard.
*   **[TaskCard.tsx](./molecules/TaskCard.tsx)**: Horizontal card for individual tasks (supports swipe on mobile via Framer Motion).
*   **[FileCard.tsx](./molecules/FileCard.tsx)**: Card and Row variants for file listings.

### Organisms (`src/components/library/organisms/`)
*   **[TopBar.tsx](./organisms/TopBar.tsx)**: Responsive glassmorphism header.
*   **[BottomNav.tsx](./organisms/BottomNav.tsx)**: Floating pill navigation with entrance animation.
*   **[FAB.tsx](./organisms/FAB.tsx)**: Animated Floating Action Button with expandable menu.
*   **[CreateEventModal.tsx](./organisms/CreateEventModal.tsx)**: Responsive modal (Bottom Drawer on Mobile, Center Dialog on Desktop).

---

## 🚀 Usage Guide

### Install Dependencies
Ensure you have the following packages installed:
```bash
npm install lucide-react framer-motion clsx tailwind-merge
```

### Import & Use
```tsx
import { Button } from '@/components/library/atoms/Button';
import { OverviewCard } from '@/components/library/molecules/OverviewCard';
import { Calendar } from 'lucide-react';

export default function Example() {
  return (
    <div className="p-10 space-y-8">
      <Button variant="primary">Click Me</Button>
      
      <OverviewCard 
        title="Total Events" 
        value="24" 
        trend="+12%" 
        icon={Calendar} 
        variant="primary" 
      />
    </div>
  );
}
```

## 🎨 Token Integration
These components rely on the CSS variables defined in `src/styles/brand-tokens.css`. Ensure this file is imported in your global layout.
