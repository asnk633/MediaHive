import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tasks, users, notifications } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { authorize } from '../../_lib/rbac';

// Schema for validating the request body
const createGuestTaskSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    dueDate: z.string().optional(),
    // assignedBy is no longer needed in body as we get it from auth
});

export async function POST(req: NextRequest) {
    try {
        // Authorize user - Guest needs create:tasks permission
        const user = await authorize(req, 'create:tasks');
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();

        // Validate request body
        const validationResult = createGuestTaskSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                { error: 'Validation failed', details: validationResult.error.format() },
                { status: 400 }
            );
        }

        const { title, dueDate } = validationResult.data;

        // Use the authorized user
        const guestUser = user;

        const now = new Date().toISOString();

        // Create the task
        const [newTask] = await db.insert(tasks).values({
            title,
            description: 'Task submitted by guest',
            status: 'pending', // Auto-assign status=pending
            priority: 'low',   // Auto-assign priority=low
            assignedToId: null, // Not assigned to anyone yet
            createdById: guestUser.id,
            institutionId: guestUser.institutionId,
            tenantId: guestUser.tenantId,
            dueDate: dueDate || null,
            createdAt: now,
            updatedAt: now,
        }).returning();

        // Notify admins
        // Find admins in the same tenant
        const admins = await db
            .select()
            .from(users)
            .where(
                and(
                    eq(users.role, 'admin'),
                    eq(users.tenantId, guestUser.tenantId)
                )
            );

        if (admins.length > 0) {
            const notificationValues = admins.map((admin: typeof users.$inferSelect) => ({
                userId: admin.id,
                type: 'task_created',
                title: 'New Guest Task',
                body: `Guest ${guestUser.fullName} submitted a new task: ${title}`,
                readAt: null,
                createdAt: now,
                updatedAt: now,
            }));

            await db.insert(notifications).values(notificationValues);
        }

        return NextResponse.json(
            { data: newTask, message: 'Task created and admins notified' },
            { status: 201 }
        );

    } catch (error) {
        console.error('[POST /api/guest-tasks/create]', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
