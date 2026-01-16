import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

export const EventTaskService = {
    /**
     * Create a task for an event if media coverage is requested.
     * Idempotent: Checks if task already exists.
     */
    createTaskForEvent: async (eventData: any, eventId: string, user: any) => {
        if (!eventData.mediaCoverage || eventData.mediaCoverage.length === 0) {
            return;
        }

        console.log(`[EventTaskService] Event ${eventId} has media coverage. Checking for task creation...`);

        // Idempotency Check
        const existingTasks = await adminDb.collection('tasks')
            .where('meta.eventId', '==', eventId)
            .limit(1)
            .get();

        if (!existingTasks.empty) {
            console.log(`[EventTaskService] Task already exists for event ${eventId}. Skipping.`);
            return;
        }

        const taskTitle = `Media Coverage: ${eventData.title}`;

        // Determine Owner/Structure for Task
        // Inherit from event
        const taskInstitutionId = eventData.institutionId || '1';
        let taskDepartmentId = eventData.departmentId || null;

        // If onBehalfOf is a Department, prioritize that ID (logic from inline code)
        // (Previously commented out in inline code, keeping consistent but we have logic ready)
        if (eventData.onBehalfOf && eventData.onBehalfOf.type === 'department' && eventData.onBehalfOf.id) {
            taskDepartmentId = eventData.onBehalfOf.id;
        }

        const newTask = {
            title: taskTitle,
            description: `Media coverage requested for event: ${eventData.title}\n\nRequests: ${eventData.mediaCoverage.join(', ')}\n\nEvent Description: ${eventData.description || 'N/A'}`,
            status: 'todo',
            priority: 'medium',
            tags: [...eventData.mediaCoverage, 'Event Coverage'],
            institutionId: taskInstitutionId,
            departmentId: taskDepartmentId,
            dueDate: new Date(eventData.date), // Deadline is event start
            createdBy: eventData.createdBy || { uid: user.uid, name: user.name, role: user.role },
            onBehalfOf: eventData.onBehalfOf || null,
            meta: {
                eventId: eventId,
                origin: 'event_automation',
                mediaRequest: true
            },
            createdAt: FieldValue.serverTimestamp(), // Use server timestamp
            updatedAt: FieldValue.serverTimestamp()
        };

        await adminDb.collection('tasks').add(newTask);
        console.log(`[EventTaskService] Created automation task for event ${eventId}`);
    },

    /**
     * Sync task when event is updated.
     */
    syncTaskForEvent: async (eventId: string, fullEventState: any, updates: any) => {
        console.log(`[EventTaskService] Syncing task for event ${eventId}. Coverage: ${fullEventState.mediaCoverage?.length}`);

        const existingTasksSnapshot = await adminDb.collection('tasks')
            .where('meta.eventId', '==', eventId)
            .limit(1)
            .get();

        const hasMedia = fullEventState.mediaCoverage && fullEventState.mediaCoverage.length > 0;

        if (!existingTasksSnapshot.empty) {
            const taskDoc = existingTasksSnapshot.docs[0];

            if (!hasMedia) {
                // Case: Media removed -> Cancel Task
                if (taskDoc.data().status !== 'cancelled') {
                    await taskDoc.ref.update({
                        status: 'cancelled',
                        updatedAt: FieldValue.serverTimestamp()
                    });
                    console.log(`[EventTaskService] Cancelled task ${taskDoc.id} for event ${eventId} (No media coverage)`);
                }
            } else {
                // Case: Task exists & has media -> Update
                // Authoritative Tags: Overwrite with current media + 'Event Coverage'
                const newTags = [...fullEventState.mediaCoverage, 'Event Coverage'];

                // If task was cancelled, reactivate it? (Optional, but safe assumption for sync)
                // We'll keep status as is unless it was cancelled, then maybe todo?
                // User didn't specify reactivation content, so we just update details.
                // But if it's cancelled and we add media, it should probably be 'todo'.
                const currentStatus = taskDoc.data().status;
                const newStatus = currentStatus === 'cancelled' ? 'todo' : currentStatus;

                const taskUpdates = {
                    dueDate: new Date(fullEventState.date),
                    tags: newTags, // Authoritative
                    status: newStatus,
                    description: `Media coverage requested for event: ${fullEventState.title}\n\nRequests: ${fullEventState.mediaCoverage.join(', ')}\n\nEvent Description: ${fullEventState.description || 'N/A'}`,
                    updatedAt: FieldValue.serverTimestamp()
                };
                await taskDoc.ref.update(taskUpdates);
                console.log(`[EventTaskService] Updated existing task ${taskDoc.id} for event ${eventId}`);
            }
        } else if (hasMedia) {
            // Task missing & has media -> Create it (Recovery)
            const sourceOnBehalfOf = updates.onBehalfOf || fullEventState.onBehalfOf || null;
            let taskInstitutionId = updates.institutionId || fullEventState.institutionId;
            let taskDepartmentId = updates.departmentId || fullEventState.departmentId;

            const newTask = {
                title: `Media Coverage: ${fullEventState.title}`,
                description: `Media coverage requested for event: ${fullEventState.title}\n\nRequests: ${fullEventState.mediaCoverage.join(', ')}\n\nEvent Description: ${fullEventState.description || 'N/A'}`,
                status: 'todo',
                priority: 'medium',
                // Authoritative Tags
                tags: [...fullEventState.mediaCoverage, 'Event Coverage'],
                institutionId: taskInstitutionId,
                departmentId: taskDepartmentId,
                dueDate: new Date(fullEventState.date),
                createdBy: fullEventState.createdBy,
                onBehalfOf: sourceOnBehalfOf,
                meta: {
                    eventId: eventId,
                    origin: 'event_automation',
                    mediaRequest: true
                },
                createdAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            };

            await adminDb.collection('tasks').add(newTask);
            console.log(`[EventTaskService] Created new task for updated event ${eventId}`);
        }
    }
};
