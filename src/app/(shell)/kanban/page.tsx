// src/app/(shell)/kanban/page.tsx
// Kanban Board Page with lazy loading

"use client";

import React, { Suspense, useEffect, useState } from 'react';

// Lazy load the KanbanBoard component for bundle splitting
const KanbanBoard = React.lazy(() => 
  import('@/components/KanbanBoard').then(module => ({ default: module.KanbanBoard }))
);

export default function KanbanPage() {
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch initial kanban data with pagination
    const fetchKanbanData = async () => {
      try {
        const response = await fetch('/api/kanban?limit=50&offset=0');
        if (response.ok) {
          const data = await response.json();
          setInitialData(data);
        }
      } catch (error) {
        console.error('Failed to fetch kanban data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKanbanData();
  }, []);

  if (loading) {
    return <div>Loading kanban board...</div>;
  }

  if (!initialData) {
    return <div>Failed to load kanban data</div>;
  }

  return (
    <div className="kanban-page">
      <Suspense fallback={<div>Loading kanban board...</div>}>
        <KanbanBoard 
          initialTasks={initialData.tasks} 
          counts={initialData.counts} 
        />
      </Suspense>
    </div>
  );
}