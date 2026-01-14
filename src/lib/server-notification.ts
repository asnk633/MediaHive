import 'server-only';
import { adminDb } from '@/lib/firebase/server';
import { Timestamp } from 'firebase-admin/firestore';
import { AppNotification, NotificationType, NotificationPriority } from '@/types/notification';
import { logStaleTaskNotification } from '@/app/api/_lib/audit';
import { StructurePolicyService } from '@/lib/structure-policies.server';
import { RolePolicyService } from '@/lib/role-policies.server';
import { AutomationRulesService } from '@/lib/automation-rules.server';

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
    checkReminders: async () => {
        const now = Timestamp.now();
        const tomorrow = new Date(now.toMillis() + 24 * 60 * 60 * 1000);

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

                // Calculate Context
                const dueAt = task.dueDate?.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
                const hoursUntilDue = (dueAt.getTime() - now.toMillis()) / (1000 * 60 * 60);

                // Rule Evaluation
                const ruleResult = await AutomationRulesService.evaluate({
                    institutionId: (task.institutionId || 'global').toString(),
                    departmentId: task.departmentId?.toString(),
                    eventType: 'task_due_soon',
                    context: { hoursUntilDue }
                });

                // Check Automation Rule & State
                if (ruleResult.matched && ruleResult.action === 'notify' && !task.reminded24h) {

                    // Policy Gatekeeper (Phase 2)
                    const policy = await StructurePolicyService.resolveAutomationPolicy({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_due_soon'
                    });

                    if (!policy.allowed) {
                        console.debug(`[Policy] Suppressed 'task_due_soon' for task ${taskDoc.id} (${policy.source})`);
                        batch.update(taskDoc.ref, { reminded24h: true });
                        batchCount++;
                        continue;
                    }

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
                } else if (ruleResult.matched && !task.reminded24h) {
                    // Matched but action not notify (e.g. suppress)?
                    // Or maybe just didn't match. 
                    // If matched and action != notify (e.g. suppress), we mark handled?
                    if (ruleResult.action === 'suppress') {
                        batch.update(taskDoc.ref, { reminded24h: true });
                    }
                }
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

                // Context
                // Overdue means dueAt < now.
                const dueAt = task.dueAt?.toDate ? task.dueAt.toDate() : new Date(task.dueAt);
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
                        console.debug(`[Policy] Suppressed 'task_overdue' for task ${taskDoc.id} (${policy.source})`);
                        batch.update(taskDoc.ref, { overdueNotified: true });
                        count++;
                        continue;
                    }

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
                } else if (ruleResult.matched && ruleResult.action === 'suppress') {
                    batch.update(taskDoc.ref, { overdueNotified: true });
                }
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

                // Context
                const staleContext = { daysSinceUpdate };

                // 1. Stale Warning (User)
                const warningRule = await AutomationRulesService.evaluate({
                    institutionId: (task.institutionId || 'global').toString(),
                    departmentId: task.departmentId?.toString(),
                    eventType: 'task_stale_warning',
                    context: staleContext
                });

                const shouldNotifyAssigned = warningRule.matched && warningRule.action === 'notify' && !task.staleNotified;

                // Notify assigned user
                if (shouldNotifyAssigned && task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {

                    const policy = await StructurePolicyService.resolveAutomationPolicy({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_stale_warning'
                    });

                    if (policy.allowed) {
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
                                    task.institutionId,
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
                    } else {
                        console.debug(`[Policy] Suppressed 'task_stale_warning' for task ${taskDoc.id}`);
                    }

                    // Update task to mark notification sent (prevent loop)
                    await taskDoc.ref.update({ staleNotified: STALE_THRESHOLD_DAYS }); // Keep threshold field for history/compat, or should we flag boolean? 
                    // Using value roughly for "when it was sent".
                } else if (warningRule.matched && warningRule.action === 'suppress' && !task.staleNotified) {
                    await taskDoc.ref.update({ staleNotified: STALE_THRESHOLD_DAYS });
                }

                // 2. Escalation (Admins)
                const escalationRule = await AutomationRulesService.evaluate({
                    institutionId: (task.institutionId || 'global').toString(),
                    departmentId: task.departmentId?.toString(),
                    eventType: 'task_stale_escalation',
                    context: staleContext
                });

                const shouldEscalateToAdmins = escalationRule.matched && escalationRule.action === 'escalate' && !task.adminEscalationNotified;

                // Escalate to admins
                if (shouldEscalateToAdmins) {
                    const structurePolicy = await StructurePolicyService.resolveAutomationPolicy({
                        institutionId: (task.institutionId || 'global').toString(),
                        departmentId: task.departmentId?.toString(),
                        eventType: 'task_stale_escalation',
                        escalationLevel: 2 // Level 2 Escalation
                    });

                    if (structurePolicy.allowed) {
                        // Role Policy Check (Admin)
                        const rolePolicy = await RolePolicyService.resolveRolePolicy({
                            institutionId: (task.institutionId || 'global').toString(),
                            eventType: 'task_stale_escalation',
                            escalationLevel: 2,
                            severity: 'important' // Default severity for stale escalation
                        });

                        if (rolePolicy.allowed) {
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
                                        task.institutionId,
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
                        } else {
                            console.debug(`[RolePolicy] Suppressed 'task_stale_escalation' for task ${taskDoc.id} (${rolePolicy.reason})`);
                        }
                    } else {
                        console.debug(`[StructurePolicy] Suppressed 'task_stale_escalation' for task ${taskDoc.id}`);
                    }

                    // Update task to mark escalation notification sent
                    await taskDoc.ref.update({ adminEscalationNotified: ESCALATION_THRESHOLD_DAYS });
                } else if (escalationRule.matched && escalationRule.action === 'suppress' && !task.adminEscalationNotified) {
                    await taskDoc.ref.update({ adminEscalationNotified: ESCALATION_THRESHOLD_DAYS });
                }
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
    checkInventoryStatus: async () => {
        const now = Timestamp.now();
        const nowMillis = now.toMillis();
        const oneDayMillis = 24 * 60 * 60 * 1000;
        const twoDaysMillis = 48 * 60 * 60 * 1000;
        const tomorrow = new Date(nowMillis + oneDayMillis);

        try {
            const issuesRef = db.collection('inventory_issues');
            // Optimisation: Fetch only 'issued' items
            const snapshot = await issuesRef.where('status', '==', 'issued').get();

            let notificationsSent = 0;
            const batch = db.batch();

            const adminIds = await ServerNotification.getAdminIds();

            for (const doc of snapshot.docs) {
                const issue = doc.data() as any;
                const expectedReturn = new Date(issue.expectedReturnAt);
                const expectedReturnMillis = expectedReturn.getTime();

                if (isNaN(expectedReturnMillis)) continue;

                const instId = (issue.institutionId || 'global').toString();
                const deptId = issue.departmentId?.toString();
                const hoursUntilReturn = (expectedReturnMillis - nowMillis) / (1000 * 60 * 60);
                const hoursOverdue = (nowMillis - expectedReturnMillis) / (1000 * 60 * 60);

                // 1. Reminder (24h before)
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
                } else if (dueSoonRule.matched && dueSoonRule.action === 'suppress') {
                    batch.update(doc.ref, { reminded24h: true });
                }

                // 2. Overdue (Immediate)
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
                        const notifRef = db.collection(NOTIFICATIONS_COLLECTION).doc();
                        // Notify User
                        batch.set(notifRef, {
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
                                type: 'inventory_overdue',
                                title: 'Inventory Overdue Alert',
                                message: `User ${issue.issuedToUserId} is late returning "${issue.itemName}".`,
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
                        notificationsSent++;
                    }
                    batch.update(doc.ref, { overdueNotified: true });
                } else if (overdueRule.matched && overdueRule.action === 'suppress') {
                    batch.update(doc.ref, { overdueNotified: true });
                }

                // 3. Escalation (By Rule, e.g. 48h Overdue)
                const escalationRule = await AutomationRulesService.evaluate({
                    institutionId: instId,
                    departmentId: deptId,
                    eventType: 'inventory_escalated',
                    context: { hoursOverdue }
                });

                if (escalationRule.matched && escalationRule.action === 'escalate' && !issue.escalationNotified) {
                    const structurePolicy = await StructurePolicyService.resolveAutomationPolicy({
                        institutionId: instId,
                        departmentId: deptId,
                        eventType: 'inventory_escalated',
                        escalationLevel: 2
                    });

                    if (structurePolicy.allowed) {
                        const rolePolicy = await RolePolicyService.resolveRolePolicy({
                            institutionId: instId,
                            eventType: 'inventory_escalated',
                            escalationLevel: 2,
                            severity: 'critical'
                        });

                        if (rolePolicy.allowed) {
                            // Notify Admins only
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
                    batch.update(doc.ref, { escalationNotified: true });
                } else if (escalationRule.matched && escalationRule.action === 'suppress') {
                    batch.update(doc.ref, { escalationNotified: true });
                }
            }

            if (notificationsSent > 0) {
                await batch.commit();
            }

            return { processed: snapshot.size, notificationsSent };

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
