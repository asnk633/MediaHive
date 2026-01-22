import { Suspense } from 'react';
import TasksViewClient from './TasksViewClient';

export default function TasksViewPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-[var(--bg-card)]" />}>
            <TasksViewClient />
        </Suspense>
    );
}
