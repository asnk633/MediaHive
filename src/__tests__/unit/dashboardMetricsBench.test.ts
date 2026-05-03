
import { computeDashboardMetrics } from '@/lib/dashboardMetrics';
import { normalizeTasks } from '@/lib/normalization';
import { Task } from '@/features/tasks/types/task';

// Mocks
const mockTask = (id: number): Task => ({
    id: `task-${id}`,
    title: `Task ${id}`,
    status: id % 10 === 0 ? 'done' : 'todo',
    due_date: new Date(),
    institution_id: 'inst-1',
    created_at: new Date(),
    updated_at: new Date(),
    created_by: { uid: 'user-1', displayName: 'U1', email: 'u1@e.com' },
    assigned_to: []
} as Task);

const generateTasks = (count: number) => Array.from({ length: count }, (_, i) => mockTask(i));

describe('Dashboard Metrics Benchmark', () => {
    const user = { uid: 'user-1', role: 'admin', institution_id: 'inst-1' };

    test('Benchmark: 1,000 Tasks', () => {
        const tasks = normalizeTasks(generateTasks(1000));
        const start = performance.now();
        computeDashboardMetrics(tasks, [], user);
        const end = performance.now();
        console.log(`BENCHMARK 1k Tasks: ${(end - start).toFixed(4)}ms`);
    });

    test('Benchmark: 5,000 Tasks', () => {
        const tasks = normalizeTasks(generateTasks(5000));
        const start = performance.now();
        computeDashboardMetrics(tasks, [], user);
        const end = performance.now();
        console.log(`BENCHMARK 5k Tasks: ${(end - start).toFixed(4)}ms`);
    });

    test('Benchmark: 10,000 Tasks', () => {
        const tasks = normalizeTasks(generateTasks(10000));
        const start = performance.now();
        computeDashboardMetrics(tasks, [], user);
        const end = performance.now();
        console.log(`BENCHMARK 10k Tasks: ${(end - start).toFixed(4)}ms`);
    });

    test('Benchmark: 50,000 Tasks (Stress)', () => {
        const tasks = normalizeTasks(generateTasks(50000));
        const start = performance.now();
        computeDashboardMetrics(tasks, [], user);
        const end = performance.now();
        console.log(`BENCHMARK 50k Tasks: ${(end - start).toFixed(4)}ms`);
    });
});
