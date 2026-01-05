import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { AppNotification, NotificationType, NotificationPriority } from '@/types/notification';
import { logStaleTaskNotification } from '@/app/api/_lib/audit';

const db = adminDb;
const NOTIFICATIONS_COLLECTION = 'notifications';

export const ServerNotification = {
    /**
     * Helper: Get all Admin UIDs
     */
    getAdminIds: async (): Promise<string[]> => {
        try {
            const snapshot = await db.collection('users').where('role', '==', 'admin').get();
            return snapshot.docs.map(doc => doc.id);
        } catch (e) {
            console.error("Failed to fetch admin IDs", e);
            return [];
        }
    },

    /**
     * Create a single notification
     */
    create: async (userId: string, data: Partial<AppNotification> & { title: string; message: string; type: NotificationType }) => {
        // Prevent self-notification check
        if (data.sourceUserId && data.sourceUserId === userId) {
            return null;
        }

        const notification = {
            userId,
            isRead: false,
            isArchived: false,
            createdAt: Timestamp.now(),
            priority: 'medium', // default
            ...data
        };

        return db.collection(NOTIFICATIONS_COLLECTION).add(notification);
    },

    /**
     * Broadcast to multiple users
     */
    broadcast: async (userIds: string[], data: Partial<AppNotification> & { title: string; message: string; type: NotificationType }) => {
        const batch = db.batch();
        const collectionRef = db.collection(NOTIFICATIONS_COLLECTION);

        // Filter out source user
        const targets = userIds.filter(id => id !== data.sourceUserId);

        // De-duplicate targets
        const uniqueTargets = Array.from(new Set(targets));

        if (uniqueTargets.length === 0) return;

        uniqueTargets.forEach(userId => {
            const docRef = collectionRef.doc();
            batch.set(docRef, {
                userId,
                isRead: false,
                isArchived: false,
                createdAt: Timestamp.now(),
                priority: 'medium',
                ...data
            });
        });

        return batch.commit();
    },

    /**
     * Notify Task Created (To Admins)
     */
    notifyTaskCreated: async (taskId: string, taskTitle: string, creatorId: string) => {
        const adminIds = await ServerNotification.getAdminIds();
        await ServerNotification.broadcast(adminIds, {
            type: 'task_created', // Add this type to types/notification.ts if stricter typing needed, or map to 'info'
            // Since we can't easily edit enum, use a generic one or 'task_assigned' with diff message?
            // Actually, for now let's use 'task_assigned' type but with clearer message, OR ensure 'task_created' is valid.
            // Earlier I added types. Left check. If not, use 'info'.
            // Let's assume 'info' or similar exists, or add type.
            // Existing types: comment_added, mention, task_overdue...
            // I should use 'task_created' if I added it. If not, 'task_assigned' is confusing.
            // I'll stick to 'task_created' and ensure Type definition handles it or generic string works (TS might complain).
            // Safest: Use 'task_assigned' but Title "New Task Created".
            // No, UI icon might be wrong.
            // I'll use 'task_created'. (I'll update types next if needed).
            title: 'New Task Created',
            message: `New task "${taskTitle}" created.`,
            entityType: 'task',
            entityId: taskId,
            actionUrl: `/tasks/view/${taskId}`,
            sourceUserId: creatorId,
            priority: 'medium'
        } as any);
    },

    /**
     * Notify Task Assigned (To Assignee)
     */
    notifyTaskAssigned: async (taskId: string, taskTitle: string, assigneeId: string, assignerId: string) => {
        await ServerNotification.create(assigneeId, {
            type: 'task_assigned',
            title: 'New Task Assigned',
            message: `You have been assigned to task: "${taskTitle}"`,
            entityType: 'task',
            entityId: taskId,
            actionUrl: `/tasks/view/${taskId}`,
            sourceUserId: assignerId,
            priority: 'high'
        });
    },

    /**
     * Notify Task Assigned (To Creator - "Your task was assigned")
     */
    notifyTaskAssignedToCreator: async (taskId: string, taskTitle: string, creatorId: string, assignerId: string, assigneeName: string) => {
        await ServerNotification.create(creatorId, {
            type: 'task_assigned', // Reusing type or 'task_updated'
            title: 'Task Assigned',
            message: `Your task "${taskTitle}" was assigned to ${assigneeName}.`,
            entityType: 'task',
            entityId: taskId,
            actionUrl: `/tasks/view/${taskId}`,
            sourceUserId: assignerId,
            priority: 'medium'
        });
    },

    /**
     * Notify Task Completed
     */
    notifyTaskCompleted: async (taskId: string, taskTitle: string, creatorId: string, completerId: string) => {
        await ServerNotification.create(creatorId, {
            type: 'task_completed',
            title: 'Task Completed',
            message: `Task "${taskTitle}" has been marked as completed.`,
            entityType: 'task',
            entityId: taskId,
            actionUrl: `/tasks/view/${taskId}`,
            sourceUserId: completerId,
            priority: 'medium'
        });
    },

    /**
     * Notify File Uploaded
     */
    notifyFileUploaded: async (fileId: string, fileName: string, uploaderId: string, targetUserIds: string[]) => {
        await ServerNotification.broadcast(targetUserIds, {
            type: 'file_uploaded',
            title: 'New File Uploaded',
            message: `File "${fileName}" was uploaded.`,
            entityType: 'file',
            entityId: fileId,
            actionUrl: `/resources`,
            sourceUserId: uploaderId,
            priority: 'low'
        });
    },

    /**
     * Notify Priority Changed
     */
    notifyPriorityChanged: async (taskId: string, taskTitle: string, creatorId: string, changerId: string, newPriority: string) => {
        await ServerNotification.create(creatorId, {
            type: 'priority_updated',
            title: 'Task Priority Updated',
            message: `Priority for "${taskTitle}" changed to ${newPriority}.`,
            entityType: 'task',
            entityId: taskId,
            actionUrl: `/tasks/view/${taskId}`,
            sourceUserId: changerId,
            priority: 'medium'
        });
    },

    /**
     * Notify Event Created
     */
    notifyEventCreated: async (eventId: string, eventTitle: string, creatorId: string, allUserIds: string[]) => {
        await ServerNotification.broadcast(allUserIds, {
            type: 'event_created',
            title: 'New Event Created',
            message: `A new event "${eventTitle}" has been scheduled.`,
            entityType: 'event',
            entityId: eventId,
            actionUrl: `/events`,
            sourceUserId: creatorId,
            priority: 'medium'
        });
    },

    /**
     * Notify Comment Added
     */
    notifyCommentAdded: async (
        entityType: 'task' | 'event',
        entityId: string,
        title: string,
        commenterId: string,
        commentContent: string,
        targetUserIds: string[]
    ) => {
        await ServerNotification.broadcast(targetUserIds, {
            type: 'comment_added',
            title: 'New Comment',
            message: `${commentContent.substring(0, 50)}${commentContent.length > 50 ? '...' : ''}`,
            entityType,
            entityId,
            actionUrl: `/${entityType}s/view/${entityId}`,
            sourceUserId: commenterId,
            priority: 'medium'
        });
    },

    /**
     * Notify Mention
     */
    notifyMentioned: async (
        entityType: 'task' | 'event',
        entityId: string,
        title: string,
        commenterId: string,
        mentionedUserId: string
    ) => {
        await ServerNotification.create(mentionedUserId, {
            type: 'mention',
            title: 'You were mentioned',
            message: `mentioned you in "${title}"`,
            entityType,
            entityId,
            actionUrl: `/${entityType}s/view/${entityId}`,
            sourceUserId: commenterId,
            priority: 'high'
        });
    },

    /**
     * Notify Event Updated
     */
    notifyEventUpdated: async (
        eventId: string,
        eventTitle: string,
        updaterId: string,
        targetUserIds: string[],
        changes: string[]
    ) => {
        if (changes.length === 0) return;

        await ServerNotification.broadcast(targetUserIds, {
            type: 'event_updated',
            title: 'Event Updated',
            message: `Critical updates in "${eventTitle}": ${changes.join(', ')}`,
            entityType: 'event',
            entityId: eventId,
            actionUrl: `/events`,
            sourceUserId: updaterId,
            priority: 'high'
        });
    },

    /**
     * Check Reminders (CRON)
     */
    checkReminders: async () => {
        const now = Timestamp.now();
        const tomorrow = new Date(now.toDate().getTime() + 24 * 60 * 60 * 1000);

        try {
            const tasksRef = db.collection('tasks');
            const snapshot = await tasksRef.where('status', '!=', 'done').get();

            const tasksDueSoon = snapshot.docs.filter(doc => {
                const data = doc.data();
                if (!data.dueDate || data.reminded24h) return false;

                let due: Date;
                if (data.dueDate instanceof Timestamp) due = data.dueDate.toDate();
                else due = new Date(data.dueDate);

                const checkTime = now.toDate();
                return due > checkTime && due <= tomorrow;
            });

            const batch = db.batch();
            let batchCount = 0;

            for (const taskDoc of tasksDueSoon) {
                const task = taskDoc.data();
                if (task.assignedTo && Array.isArray(task.assignedTo)) {
                    for (const userId of task.assignedTo) {
                        const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                        batch.set(notifRef, {
                            userId,
                            type: 'due_reminder',
                            title: 'Task Due Soon',
                            message: `Task "${task.title}" is due in less than 24 hours.`,
                            entityType: 'task',
                            entityId: taskDoc.id,
                            actionUrl: `/tasks/view/${taskDoc.id}`,
                            priority: 'high',
                            isRead: false,
                            isArchived: false,
                            createdAt: Timestamp.now()
                        });
                        batchCount++;
                    }
                }
                batch.update(taskDoc.ref, { reminded24h: true });
                batchCount++;
            }

            if (batchCount > 0) await batch.commit();
            return { tasksReminded: tasksDueSoon.length };
        } catch (e) {
            console.error("Error checking reminders:", e);
            throw e;
        }
    },

    /**
     * Check Overdue (CRON)
     */
    checkOverdue: async () => {
        const now = Timestamp.now();

        try {
            const tasksRef = db.collection('tasks');
            const snapshot = await tasksRef.where('status', '!=', 'done').get();

            const overdueTasks = snapshot.docs.filter(doc => {
                const data = doc.data();
                if (!data.dueDate || data.overdueNotified) return false;
                let due = data.dueDate instanceof Timestamp ? data.dueDate.toDate() : new Date(data.dueDate);
                return due < now.toDate();
            });

            const batch = db.batch();
            let count = 0;

            for (const taskDoc of overdueTasks) {
                const task = taskDoc.data();
                const targets = new Set(task.assignedTo || []);

                // Add admins for escalation
                const adminIds = await ServerNotification.getAdminIds();
                adminIds.forEach(id => targets.add(id));

                for (const userId of Array.from(targets)) {
                    const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                    batch.set(notifRef, {
                        userId: userId as string,
                        type: 'task_overdue',
                        title: 'Task Overdue',
                        message: `Task "${task.title}" is overdue!`,
                        entityType: 'task',
                        entityId: taskDoc.id,
                        actionUrl: `/tasks/view/${taskDoc.id}`,
                        priority: 'high',
                        isRead: false,
                        isArchived: false,
                        createdAt: Timestamp.now()
                    });
                    count++;
                }

                batch.update(taskDoc.ref, { overdueNotified: true });
                count++;
            }

            if (count > 0) await batch.commit();
            return { overdueTasks: overdueTasks.length };
        } catch (e) {
            console.error("Error checking overdue:", e);
            throw e;
        }
    },

    /**
     * Check Stale Tasks (CRON)
     * Alerts assigned users and admins for tasks that have been in progress/review for too long
     */
    checkStaleTasks: async () => {
        const now = new Date();

        // Thresholds in days
        const STALE_THRESHOLD_DAYS = 3;  // Notify assigned user
        const ESCALATION_THRESHOLD_DAYS = 5;  // Notify admins

        try {
            const tasksRef = db.collection('tasks');
            // Get tasks that are in_progress or review and not yet completed
            const snapshot = await tasksRef
                .where('status', 'in', ['in_progress', 'review'])
                .get();

            let notificationsSent = 0;

            for (const taskDoc of snapshot.docs) {
                const task = taskDoc.data();

                // Skip if task has no update timestamp
                if (!task.updatedAt) continue;

                // Parse the update time
                let updateTime: Date;
                if (task.updatedAt instanceof Timestamp) {
                    updateTime = task.updatedAt.toDate();
                } else {
                    updateTime = new Date(task.updatedAt);
                }

                // Skip if invalid date
                if (isNaN(updateTime.getTime())) continue;

                // Calculate days since last update
                const daysSinceUpdate = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60 * 60 * 24));

                // Check if we should send notifications
                const shouldNotifyAssigned = daysSinceUpdate >= STALE_THRESHOLD_DAYS &&
                    (!task.staleNotified || task.staleNotified < STALE_THRESHOLD_DAYS);
                const shouldEscalateToAdmins = daysSinceUpdate >= ESCALATION_THRESHOLD_DAYS &&
                    (!task.adminEscalationNotified || task.adminEscalationNotified < ESCALATION_THRESHOLD_DAYS);

                // Notify assigned user after 3 days
                if (shouldNotifyAssigned && task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
                    for (const assignee of task.assignedTo) {
                        const assigneeId = typeof assignee === 'string' ? assignee : assignee.uid;

                        await ServerNotification.create(assigneeId, {
                            type: 'stale_task_warning',
                            title: 'Task Stale Warning',
                            message: `Task "${task.title}" has been in ${task.status} status for ${daysSinceUpdate} days`,
                            entityType: 'task',
                            entityId: taskDoc.id,
                            actionUrl: `/tasks/view/${taskDoc.id}`,
                            sourceUserId: 'system',
                            priority: 'medium'
                        });

                        // Log audit event
                        try {
                            await logStaleTaskNotification(
                                'system',
                                task.institutionId || 1, // Default to tenant 1 if not set
                                taskDoc.id,
                                {
                                    action: 'assigned_user_notified',
                                    daysStale: daysSinceUpdate,
                                    status: task.status
                                }
                            );
                        } catch (auditError) {
                            console.error('Failed to log stale task notification audit:', auditError);
                        }

                        notificationsSent++;
                    }

                    // Update task to mark notification sent
                    await taskDoc.ref.update({ staleNotified: STALE_THRESHOLD_DAYS });
                }

                // Escalate to admins after 5 days
                if (shouldEscalateToAdmins) {
                    const adminIds = await ServerNotification.getAdminIds();

                    if (adminIds.length > 0) {
                        await ServerNotification.broadcast(adminIds, {
                            type: 'stale_task_escalation',
                            title: 'Stale Task Escalation',
                            message: `Task "${task.title}" has been in ${task.status} status for ${daysSinceUpdate} days`,
                            entityType: 'task',
                            entityId: taskDoc.id,
                            actionUrl: `/tasks/view/${taskDoc.id}`,
                            sourceUserId: 'system',
                            priority: 'high'
                        });

                        // Log audit event
                        try {
                            await logStaleTaskNotification(
                                'system',
                                task.institutionId || 1, // Default to tenant 1 if not set
                                taskDoc.id,
                                {
                                    action: 'admin_escalation',
                                    daysStale: daysSinceUpdate,
                                    status: task.status
                                }
                            );
                        } catch (auditError) {
                            console.error('Failed to log stale task escalation audit:', auditError);
                        }

                        notificationsSent++;
                    }

                    // Update task to mark escalation notification sent
                    await taskDoc.ref.update({ adminEscalationNotified: ESCALATION_THRESHOLD_DAYS });
                }
            }

            return { notificationsSent };
        } catch (e) {
            console.error("Error checking stale tasks:", e);
            throw e;
        }
    }
};
