import { NextRequest } from 'next/server';
import { adminDb } from '@/lib/firebase/server';
import { verifyUser } from '@/lib/server-utils';

export async function GET(request: NextRequest) {
    try {
        const user = await verifyUser(request);
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const role = searchParams.get('role');
        const userId = searchParams.get('userId');

        const db = adminDb;
        let query: FirebaseFirestore.Query = db.collection('tasks');

        // Apply filters if necessary (consistent with getTasks behavior logic, primarily Role based)
        // If Admin/Team, they usually see everything or filtered by assignment.
        // For stats, "Overview" usually implies "Global" for Admin, and maybe "Global" or "My Dept" for Team?
        // The current UI shows "Media Team Overview" which implies Global/Team-wide stats.

        // For now, fetch all tasks to calculate accurate global stats
        // Optimization: In future, use aggregation queries.

        const snapshot = await query.get();

        const stats = {
            todo: 0,
            inProgress: 0,
            onHold: 0,
            review: 0,
            done: 0,
            pending: 0,
            total: 0,
            working: 0,
            completed: 0,
            overdue: 0,
            next7Days: 0
        };

        const now = new Date();

        snapshot.forEach(doc => {
            const task = doc.data();
            stats.total++;

            switch (task.status) {
                case 'todo': stats.todo++; break;
                case 'in_progress': stats.inProgress++; stats.working++; break;
                case 'on_hold': stats.onHold++; break;
                case 'review': stats.review++; stats.working++; break;
                case 'done': stats.done++; stats.completed++; break;
                case 'pending': stats.pending++; break;
            }

            // Check overdue
            if (task.status !== 'done' && task.dueDate) {
                // Handle Firestore Timestamp or string
                let due: Date | null = null;
                if (task.dueDate && typeof task.dueDate === 'object' && 'seconds' in task.dueDate) {
                    due = new Date(task.dueDate.seconds * 1000);
                } else if (typeof task.dueDate === 'string') {
                    due = new Date(task.dueDate);
                }

                if (due) {
                    if (due < now) {
                        stats.overdue++;
                    }
                    // Check next 7 days
                    const next7 = new Date();
                    next7.setDate(now.getDate() + 7);
                    if (due >= now && due <= next7) {
                        stats.next7Days++;
                    }
                }
            }
        });

        return Response.json({ stats });
    } catch (error: any) {
        console.error('Error fetching task stats:', error);
        return Response.json({ error: error.message || 'Failed to fetch task stats' }, { status: 500 });
    }
}
