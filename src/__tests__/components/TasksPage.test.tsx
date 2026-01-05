import { render, screen } from '@testing-library/react';
import TasksPage from '@/app/(shell)/tasks/page';
import { AuthContext } from '@/contexts/AuthContext';

// Mock Next.js Link component
jest.mock('next/link', () => {
    return ({ children, href }: any) => {
        return <a href={href}>{children}</a>;
    };
});

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
    useRouter: () => ({
        push: jest.fn(),
        replace: jest.fn(),
        prefetch: jest.fn(),
    }),
    useSearchParams: () => ({
        get: jest.fn(),
    }),
    usePathname: () => '/tasks',
}));

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
    Plus: () => <span>Plus Icon</span>,
    LayoutGrid: () => <span>LayoutGrid Icon</span>,
    List: () => <span>List Icon</span>,
    BarChart3: () => <span>BarChart3 Icon</span>
}));

// Mock TaskKanbanView, TaskListView, TaskConfidenceView
jest.mock('@/components/tasks/TaskKanbanView', () => ({
    TaskKanbanView: () => <div data-testid="kanban-view">Kanban View</div>
}));

jest.mock('@/components/tasks/TaskListView', () => ({
    TaskListView: () => <div data-testid="list-view">List View</div>
}));

jest.mock('@/components/tasks/TaskConfidenceView', () => ({
    TaskConfidenceView: () => <div data-testid="confidence-view">Confidence View</div>
}));

describe('TasksPage - New Task Button Visibility', () => {
    const mockAdminUser = {
        uid: 'admin-123',
        email: 'admin@test.com',
        role: 'admin',
        name: 'Admin User'
    };

    const mockGuestUser = {
        uid: 'guest-123',
        email: 'guest@test.com',
        role: 'guest',
        name: 'Guest User'
    };

    const renderWithAuth = (user: any) => {
        return render(
            <AuthContext.Provider value={{ user, loading: false, logout: jest.fn() }}>
                <TasksPage />
            </AuthContext.Provider>
        );
    };

    /**
     * REAL USER RISK: Admin users must be able to create tasks
     * If this button is hidden, admins cannot perform their core workflow
     */
    test('Admin: New Task button is visible', async () => {
        renderWithAuth(mockAdminUser);

        // Wait for component to render
        await screen.findByText('Tasks');

        // Verify "New Task" button exists and is accessible
        const newTaskButton = screen.getByLabelText('New Task');
        expect(newTaskButton).toBeInTheDocument();
        expect(newTaskButton).toBeVisible();
    });

    /**
     * REAL USER RISK: Guests should also see the New Task button
     * (Based on current implementation - button is NOT role-gated)
     * If this changes, update test accordingly
     */
    test('Guest: New Task button is visible', async () => {
        renderWithAuth(mockGuestUser);

        await screen.findByText('Tasks');

        const newTaskButton = screen.getByLabelText('New Task');
        expect(newTaskButton).toBeInTheDocument();
        expect(newTaskButton).toBeVisible();
    });

    /**
     * REAL USER RISK: View switcher should only be visible to non-guest users
     * Guests should not see Kanban/List/Confidence toggle
     */
    test('Admin: View switcher is visible', async () => {
        renderWithAuth(mockAdminUser);

        await screen.findByText('Tasks');

        // Admin should see view mode buttons
        const kanbanButton = screen.getByTitle('Kanban Board');
        const listButton = screen.getByTitle('List View');

        expect(kanbanButton).toBeInTheDocument();
        expect(listButton).toBeInTheDocument();
    });

    /**
     * REAL USER RISK: Guests should not see view switcher
     * This prevents confusion and enforces simplified guest UX
     */
    test('Guest: View switcher is hidden', async () => {
        renderWithAuth(mockGuestUser);

        await screen.findByText('Tasks');

        // Guest should NOT see view mode buttons
        const kanbanButton = screen.queryByTitle('Kanban Board');
        const listButton = screen.queryByTitle('List View');

        expect(kanbanButton).not.toBeInTheDocument();
        expect(listButton).not.toBeInTheDocument();
    });

    /**
     * REAL USER RISK: Admin Confidence Panel should only be visible to admins
     * Exposing this to non-admins could leak sensitive information
     */
    test('Admin: Confidence view button is visible', async () => {
        renderWithAuth(mockAdminUser);

        await screen.findByText('Tasks');

        const confidenceButton = screen.getByTitle('Admin Confidence Panel');
        expect(confidenceButton).toBeInTheDocument();
    });

    /**
     * REAL USER RISK: Non-admins should not see Admin Confidence Panel
     */
    test('Guest: Confidence view button is hidden', async () => {
        renderWithAuth(mockGuestUser);

        await screen.findByText('Tasks');

        const confidenceButton = screen.queryByTitle('Admin Confidence Panel');
        expect(confidenceButton).not.toBeInTheDocument();
    });

    /**
     * REAL USER RISK: Page should handle missing user gracefully
     * Prevents crashes during auth loading states
     */
    test('No user: Page renders without crashing', () => {
        render(
            <AuthContext.Provider value={{ user: null, loading: false, logout: jest.fn() }}>
                <TasksPage />
            </AuthContext.Provider>
        );

        // Should render header even without user
        expect(screen.getByText('Tasks')).toBeInTheDocument();
    });
});
