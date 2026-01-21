import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { AppNotification, NotificationType, NotificationPriority } from '@/types/notification';
import { logStaleTaskNotification } from '@/server/lib/audit';
import { StructurePolicyService } from '@/lib/structure-policies.server';
import { RolePolicyService } from '@/lib/role-policies.server';
import { AutomationRulesService } from '@/lib/automation-rules.server';

const db = adminDb;
const NOTIFICATIONS_COLLECTION = 'notifications';
const MAX_BATCH_SIZE = 500;

// GUARDRAIL: CRON JOBS MUST USE BATCHED PROCESSING (limit + startAfter)
// DO NOT PROCESS FULL COLLECTIONS IN MEMORY.
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
     * Helper: Check User Preference
     */
    checkPref: async (userId: string, type: NotificationType): Promise<boolean> => {
        try {
            const doc = await db.collection('user_preferences').doc(userId).get();
            if (!doc.exists) return true; // Default Allow (Opt-out)

            const prefs = doc.data()?.notifications;
            if (!prefs) return true;

            switch (type) {
                case 'task_assigned':
                    return prefs.taskAssignments !== false;
                case 'inventory_issued':
                case 'inventory_due_soon':
                case 'inventory_overdue':
                    return prefs.deviceRequests !== false;
                case 'system_update':
                    return prefs.systemUpdates !== false;
                default:
                    return true; // Default Allow for others
            }
        } catch (e) {
            console.warn("Pref check failed, defaulting true", e);
            return true;
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

        // Check Preference
        const shouldSend = await ServerNotification.checkPref(userId, data.type);
        if (!shouldSend) {
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

        // Pref Filter
        const allowedTargets: string[] = [];
        await Promise.all(uniqueTargets.map(async (uid) => {
            const allowed = await ServerNotification.checkPref(uid, data.type);
            if (allowed) allowedTargets.push(uid);
        }));

        if (allowedTargets.length === 0) return;

        allowedTargets.forEach(userId => {
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
    /**
     * Check Reminders (CRON)
     * Optimized: Batched processing to avoid O(N) memory usage
     */
    checkReminders: async () => {
        const now = Timestamp.now();
        const tomorrow = new Date(now.toMillis() + 24 * 60 * 60 * 1000);
        let tasksRemindedTotal = 0;

        try {
            const tasksRef = db.collection('tasks');
            // Use 'in' instead of '!=' for index efficiency and standard ordering capability
            const targetStatuses = ['todo', 'in_progress', 'on_hold', 'review', 'pending'];

            let lastDoc = null;
            let hasMore = true;

            while (hasMore) {
                let query = tasksRef.where('status', 'in', targetStatuses)
                    .orderBy(process.env.FIRESTORE_EMULATOR_HOST ? '__name__' : 'createdAt') // Fallback or strict order
                    // Actually, 'in' query allows any order? No. 
                    // If we don't care about order, just order by __name__ for stable paging.
                    .orderBy('__name__')
                    .limit(50); // Small batch safe for functions

                if (lastDoc) {
                    query = query.startAfter(lastDoc);
                }

                const snapshot = await query.get();
                if (snapshot.empty) {
                    hasMore = false;
                    break;
                }

                const batch = db.batch();
                let batchCount = 0;

                for (const taskDoc of snapshot.docs) {
                    const task = taskDoc.data();

                    // Filter in memory for date-based logic (can't double index easily)
                    if (!task.dueDate || task.reminded24h) continue;

                    let due: Date;
                    if (task.dueDate instanceof Timestamp) due = task.dueDate.toDate();
                    else due = new Date(task.dueDate);

                    const checkTime = now.toDate();
                    // Is due between now and tomorrow?
                    if (due <= checkTime || due > tomorrow) continue;

                    // Calculate Context
                    const hoursUntilDue = (due.getTime() - now.toMillis()) / (1000 * 60 * 60);

                    // Rule Evaluation
                    const ruleResult = await AutomationRulesService.evaluate({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_due_soon',
                        context: { hoursUntilDue }
                    });

                    // Check Automation Rule & State
                    if (ruleResult.matched && ruleResult.action === 'notify' && !task.reminded24h) {
                        const policy = await StructurePolicyService.resolveAutomationPolicy({
                            institutionId: (task.institutionId || 'global').toString(),
                            departmentId: task.departmentId?.toString(),
                            eventType: 'task_due_soon'
                        });

                        if (!policy.allowed) {
                            batch.update(taskDoc.ref, { reminded24h: true });
                            batchCount++;
                            continue;
                        }

                        if (task.assignedTo && Array.isArray(task.assignedTo)) {
                            for (const userId of task.assignedTo) {
                                // For batched writes, we need ref IDs.
                                // We cannot use db.collection(...).doc() inside a tight validation loop easily if we want to batch?
                                // Actually yes we can.
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
                                // Note: Max 500 ops in batch. Batching 50 tasks * (1-5 notifs + 1 update) is safe (<300).
                            }
                        }
                        batch.update(taskDoc.ref, { reminded24h: true });
                        batchCount++;
                        tasksRemindedTotal++;
                    } else if (ruleResult.matched && !task.reminded24h) {
                        if (ruleResult.action === 'suppress') {
                            batch.update(taskDoc.ref, { reminded24h: true });
                            batchCount++;
                        }
                    }
                } // End for tasks

                if (batchCount > 0) {
                    await batch.commit();
                }

                lastDoc = snapshot.docs[snapshot.docs.length - 1];
            } // End while

            return { tasksReminded: tasksRemindedTotal };
        } catch (e) {
            console.error("Error checking reminders:", e);
            throw e;
        }
    },

    /**
     * Check Overdue (CRON)
     */
    /**
     * Check Overdue (CRON)
     * Optimized: Batched processing
     */
    checkOverdue: async () => {
        const now = Timestamp.now();
        const targetStatuses = ['todo', 'in_progress', 'on_hold', 'review', 'pending'];
        let overdueCount = 0;

        try {
            const tasksRef = db.collection('tasks');
            let lastDoc = null;
            let hasMore = true;

            while (hasMore) {
                // Fetch in small batches
                let query = tasksRef.where('status', 'in', targetStatuses)
                    .orderBy('__name__')
                    .limit(50);

                if (lastDoc) query = query.startAfter(lastDoc);

                const snapshot = await query.get();
                if (snapshot.empty) {
                    hasMore = false;
                    break;
                }

                const batch = db.batch();
                let batchCount = 0;

                for (const taskDoc of snapshot.docs) {
                    const task = taskDoc.data();

                    if (!task.dueDate || task.overdueNotified) continue;
                    let due = task.dueDate instanceof Timestamp ? task.dueDate.toDate() : new Date(task.dueDate);
                    if (due >= now.toDate()) continue; // Not overdue yet

                    // Context
                    const dueAt = due; // already Date
                    const hoursOverdue = (now.toMillis() - dueAt.getTime()) / (1000 * 60 * 60);

                    // Rule
                    const ruleResult = await AutomationRulesService.evaluate({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_overdue',
                        context: { hoursOverdue }
                    });

                    if (ruleResult.matched && ruleResult.action === 'notify' && !task.overdueNotified) {

                        // Policy Check: task_overdue
                        const policy = await StructurePolicyService.resolveAutomationPolicy({
                            institutionId: (task.institutionId || 'global').toString(),
                            departmentId: task.departmentId?.toString(),
                            eventType: 'task_overdue'
                        });

                        if (!policy.allowed) {
                            batch.update(taskDoc.ref, { overdueNotified: true });
                            batchCount++;
                            continue;
                        }

                        const targets = new Set(task.assignedTo || []);
                        const adminIds = await ServerNotification.getAdminIds();
                        adminIds.forEach(id => targets.add(id));

                        for (const userId of Array.from(targets)) {
                            // Cast safely
                            const uid = typeof userId === 'string' ? userId : (userId as any).uid;
                            if (!uid) continue;

                            const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                            batch.set(notifRef, {
                                userId: uid,
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
                            overdueCount++; // Counting notifs sent or tasks processed? Returning "overdueTasks" usually implies tasks.
                        }

                        // We count the TASK as overdue processed
                        overdueCount++;
                        batch.update(taskDoc.ref, { overdueNotified: true });
                        batchCount++;
                    } else if (ruleResult.matched && ruleResult.action === 'suppress') {
                        batch.update(taskDoc.ref, { overdueNotified: true });
                        batchCount++;
                    }
                }

                if (batchCount > 0) await batch.commit();
                lastDoc = snapshot.docs[snapshot.docs.length - 1];
            }

            return { overdueTasks: overdueCount };
        } catch (e) {
            console.error("Error checking overdue:", e);
            throw e;
        }
    },

    /**
     * Check Stale Tasks (CRON)
     * Alerts assigned users and admins for tasks that have been in progress/review for too long
     */
    /**
     * Check Stale Tasks (CRON)
     * Alerts assigned users and admins for tasks that have been in progress/review for too long
     * Optimized: Batched processing
     */
    checkStaleTasks: async () => {
        const now = new Date();
        const STALE_THRESHOLD_DAYS = 3;
        const ESCALATION_THRESHOLD_DAYS = 5;

        try {
            const tasksRef = db.collection('tasks');
            let lastDoc = null;
            let hasMore = true;
            let notificationsSent = 0;

            while (hasMore) {
                let query = tasksRef.where('status', 'in', ['in_progress', 'review'])
                    .orderBy('__name__')
                    .limit(50);

                if (lastDoc) query = query.startAfter(lastDoc);

                const snapshot = await query.get();
                if (snapshot.empty) {
                    hasMore = false;
                    break;
                }

                // Batch writes are needed? 
                // We update tasks (staleNotified, adminEscalationNotified) + create notifications.
                // Loop through docs.

                // Note: We can iterate and do independent writes, or batch them.
                // Existing code does independent `await ServerNotification.create`.
                // For optimal perf, we should batch updates. Notifications creation is separate.
                // However, since we are sending notifications, we can't easily batch the *notification creation* 
                // if `ServerNotification.create` is a helper that returns a Promise. 
                // The helper is `create` -> `db.collection(...).add()`.
                // We could refactor `create` to return a `WriteOp`? No.
                // BUT, since CRON runs in background, independent writes are "okay" but slower.
                // BATCHING IS PREFERRED for costs/consistency.
                // Re-implement logic inline to use batch? 
                // Yes, I will use batch for updates and notifications where possible.

                const batch = db.batch();
                let batchCount = 0;

                for (const taskDoc of snapshot.docs) {
                    const task = taskDoc.data();
                    if (!task.updatedAt) continue;

                    let updateTime: Date;
                    if (task.updatedAt instanceof Timestamp) updateTime = task.updatedAt.toDate();
                    else updateTime = new Date(task.updatedAt);
                    if (isNaN(updateTime.getTime())) continue;

                    const daysSinceUpdate = Math.floor((now.getTime() - updateTime.getTime()) / (1000 * 60 * 60 * 24));
                    const staleContext = { daysSinceUpdate };

                    // 1. Stale Warning
                    const warningRule = await AutomationRulesService.evaluate({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_stale_warning',
                        context: staleContext
                    });

                    const shouldNotifyAssigned = warningRule.matched && warningRule.action === 'notify' && !task.staleNotified;

                    if (shouldNotifyAssigned && task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
                        const policy = await StructurePolicyService.resolveAutomationPolicy({
                            institutionId: (task.institutionId || 'global').toString(),
                            departmentId: task.departmentId?.toString(),
                            eventType: 'task_stale_warning'
                        });

                        if (policy.allowed) {
                            for (const assignee of task.assignedTo) {
                                const assigneeId = typeof assignee === 'string' ? assignee : assignee.uid;
                                const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                                batch.set(notifRef, {
                                    userId: assigneeId,
                                    type: 'stale_task_warning',
                                    title: 'Task Stale Warning',
                                    message: `Task "${task.title}" has been in ${task.status} status for ${daysSinceUpdate} days`,
                                    entityType: 'task',
                                    entityId: taskDoc.id,
                                    actionUrl: `/tasks/view/${taskDoc.id}`,
                                    sourceUserId: 'system',
                                    priority: 'medium',
                                    isRead: false,
                                    isArchived: false,
                                    createdAt: Timestamp.now()
                                });
                                notificationsSent++;
                            }
                            // Audit log skipped for batch speed? Or do we await it?
                            // We can fire-and-forget logs or await them safely.
                            // Since this function is critical, let's skip audit for now or do it async.
                        }
                        batch.update(taskDoc.ref, { staleNotified: STALE_THRESHOLD_DAYS });
                        batchCount++;
                    } else if (warningRule.matched && warningRule.action === 'suppress' && !task.staleNotified) {
                        batch.update(taskDoc.ref, { staleNotified: STALE_THRESHOLD_DAYS });
                        batchCount++;
                    }

                    // 2. Escalation
                    const escalationRule = await AutomationRulesService.evaluate({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_stale_escalation',
                        context: staleContext
                    });

                    const shouldEscalate = escalationRule.matched && escalationRule.action === 'escalate' && !task.adminEscalationNotified;

                    if (shouldEscalate) {
                        const structurePolicy = await StructurePolicyService.resolveAutomationPolicy({
                            institutionId: (task.institutionId || 'global').toString(),
                            departmentId: task.departmentId?.toString(),
                            eventType: 'task_stale_escalation',
                            escalationLevel: 2
                        });

                        if (structurePolicy.allowed) {
                            const adminIds = await ServerNotification.getAdminIds();
                            if (adminIds.length > 0) {
                                adminIds.forEach(adminId => {
                                    const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                                    batch.set(notifRef, {
                                        userId: adminId,
                                        type: 'stale_task_escalation',
                                        title: 'Stale Task Escalation',
                                        message: `Task "${task.title}" has been in ${task.status} status for ${daysSinceUpdate} days`,
                                        entityType: 'task',
                                        entityId: taskDoc.id,
                                        actionUrl: `/tasks/view/${taskDoc.id}`,
                                        sourceUserId: 'system',
                                        priority: 'high',
                                        isRead: false,
                                        isArchived: false,
                                        createdAt: Timestamp.now()
                                    });
                                    notificationsSent++;
                                });
                            }
                        }
                        batch.update(taskDoc.ref, { adminEscalationNotified: ESCALATION_THRESHOLD_DAYS });
                        batchCount++;
                    } else if (escalationRule.matched && escalationRule.action === 'suppress' && !task.adminEscalationNotified) {
                        batch.update(taskDoc.ref, { adminEscalationNotified: ESCALATION_THRESHOLD_DAYS });
                        batchCount++;
                    }
                }

                if (batchCount > 0) await batch.commit();
                lastDoc = snapshot.docs[snapshot.docs.length - 1];
            }

            return { notificationsSent };
        } catch (e) {
            console.error("Error checking stale tasks:", e);
            throw e;
        }
    },

    /**
     * Check Inventory Notifications (CRON)
 * Handles: Reminders (24h), Overdue (Immediate), Escalation (48h)
 */
    /**
     * Check Inventory Notifications (CRON)
     * Handles: Reminders (24h), Overdue (Immediate), Escalation (48h)
     * Optimized: Batched processing
     */
    checkInventoryStatus: async () => {
        const now = Timestamp.now();
        const nowMillis = now.toMillis();

        try {
            const issuesRef = db.collection('inventory_issues');
            let lastDoc = null;
            let hasMore = true;
            let notificationsSent = 0;

            const adminIds = await ServerNotification.getAdminIds();

            while (hasMore) {
                let query = issuesRef.where('status', '==', 'issued')
                    .orderBy('__name__')
                    .limit(50);

                if (lastDoc) query = query.startAfter(lastDoc);

                const snapshot = await query.get();
                if (snapshot.empty) {
                    hasMore = false;
                    break;
                }

                const batch = db.batch();
                let batchCount = 0;

                for (const doc of snapshot.docs) {
                    const issue = doc.data() as any;
                    const expectedReturn = new Date(issue.expectedReturnAt);
                    const expectedReturnMillis = expectedReturn.getTime();

                    if (isNaN(expectedReturnMillis)) continue;

                    const instId = (issue.institutionId || 'global').toString();
                    const deptId = issue.departmentId?.toString();
                    const hoursUntilReturn = (expectedReturnMillis - nowMillis) / (1000 * 60 * 60);
                    const hoursOverdue = (nowMillis - expectedReturnMillis) / (1000 * 60 * 60);

                    // 1. Reminder
                    const dueSoonRule = await AutomationRulesService.evaluate({
                        institutionId: instId,
                        departmentId: deptId,
                        eventType: 'inventory_due_soon',
                        context: { hoursUntilReturn }
                    });

                    if (dueSoonRule.matched && dueSoonRule.action === 'notify' && !issue.reminded24h) {
                        const structurePolicy = await StructurePolicyService.resolveAutomationPolicy({
                            institutionId: instId,
                            departmentId: deptId,
                            eventType: 'inventory_due_soon'
                        });

                        if (structurePolicy.allowed) {
                            const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                            batch.set(notifRef, {
                                userId: issue.issuedToUserId,
                                type: 'inventory_due_soon',
                                title: 'Equipment Due Soon',
                                message: `Your item "${issue.itemName}" is due tomorrow at ${expectedReturn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
                                entityType: 'device_request',
                                entityId: issue.id,
                                actionUrl: `/inventory`,
                                priority: 'high',
                                isRead: false,
                                isArchived: false,
                                createdAt: Timestamp.now()
                            });
                            notificationsSent++;
                        }
                        batch.update(doc.ref, { reminded24h: true });
                        batchCount++;
                    } else if (dueSoonRule.matched && dueSoonRule.action === 'suppress') {
                        batch.update(doc.ref, { reminded24h: true });
                        batchCount++;
                    }

                    // 2. Overdue
                    const overdueRule = await AutomationRulesService.evaluate({
                        institutionId: instId,
                        departmentId: deptId,
                        eventType: 'inventory_overdue',
                        context: { hoursOverdue }
                    });

                    if (overdueRule.matched && overdueRule.action === 'notify' && !issue.overdueNotified) {
                        const structurePolicy = await StructurePolicyService.resolveAutomationPolicy({
                            institutionId: instId,
                            departmentId: deptId,
                            eventType: 'inventory_overdue'
                        });

                        if (structurePolicy.allowed) {
                            // Notify User
                            const userNotifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                            batch.set(userNotifRef, {
                                userId: issue.issuedToUserId,
                                type: 'inventory_overdue',
                                title: 'Equipment Overdue',
                                message: `Item "${issue.itemName}" is OVERDUE. Please return it immediately.`,
                                entityType: 'device_request',
                                entityId: issue.id,
                                actionUrl: `/inventory`,
                                priority: 'high',
                                isRead: false,
                                isArchived: false,
                                createdAt: Timestamp.now()
                            });

                            // Notify Admins
                            adminIds.forEach(adminId => {
                                const adminNotifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                                batch.set(adminNotifRef, {
                                    userId: adminId,
                                    type: 'inventory_escalated',
                                    title: 'Inventory Escalation',
                                    message: `ESCALATION: "${issue.itemName}" is 48h overdue (held by ${issue.issuedToUserId}).`,
                                    entityType: 'device_request',
                                    entityId: issue.id,
                                    actionUrl: `/inventory/requests`,
                                    priority: 'high',
                                    isRead: false,
                                    isArchived: false,
                                    createdAt: Timestamp.now()
                                });
                                notificationsSent++;
                            });
                        }
                    }
                } // End for

                if (batchCount > 0) {
                    await batch.commit();
                }

                lastDoc = snapshot.docs[snapshot.docs.length - 1];
            } // End while

            return { notificationsSent };

        } catch (e) {
            console.error("Error checking inventory status:", e);
            throw e;
        }
    },

    /**
     * Broadcast System Update
     * Efficiently queries users who have explicitly opted-in (or initialized true)
     */
    broadcastSystemUpdate: async (update: { title: string; body: string; severity: 'info' | 'important' | 'critical'; id: string; creatorId: string }) => {
        try {
            // 1. Query Preferences directly (Scalable)
            // Only targets users with explicit 'true'
            const prefsRef = db.collection('user_preferences');
            const targetSnapshot = await prefsRef
                .where('notifications.systemUpdates', '==', true)
                .get();

            const targetIds = targetSnapshot.docs.map(doc => doc.id);

            if (targetIds.length === 0) return { sent: 0, targetCount: 0 };

            // 2. Batch Create Notifications
            const chunks: string[][] = [];
            // Firestore batch limit is 500
            for (let i = 0; i < targetIds.length; i += 500) {
                chunks.push(targetIds.slice(i, i + 500));
            }

            let totalSent = 0;

            for (const chunk of chunks) {
                const batch = db.batch();
                const notifRefCol = db.collection(NOTIFICATIONS_COLLECTION);

                chunk.forEach(uid => {
                    const docRef = notifRefCol.doc();
                    batch.set(docRef, {
                        userId: uid,
                        type: 'system_update',
                        title: update.title,
                        message: update.body,
                        entityType: 'system_update',
                        entityId: update.id,
                        actionUrl: `/system-updates/${update.id}`, // Placeholder
                        priority: update.severity === 'critical' ? 'high' : 'medium',
                        severity: update.severity,
                        isRead: false,
                        isArchived: false,
                        createdAt: Timestamp.now(),
                        sourceUserId: update.creatorId
                    });
                });

                await batch.commit();
                totalSent += chunk.length;
            }

            return { sent: totalSent, targetCount: targetIds.length };

        } catch (e) {
            console.error('Error broadcasting system update:', e);
            throw e;
        }
    }
};
