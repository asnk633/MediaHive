// config/notificationRules.ts
// Notification rules configuration

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  event: string;
  condition?: (data: any) => boolean;
  channels: string[];
  template: string;
  enabled: boolean;
}

export const notificationRules: NotificationRule[] = [
  {
    id: 'review-status-changed',
    name: 'Review Status Changed',
    description: 'Triggered when a task review status changes',
    event: 'reviewStatusChanged',
    channels: ['ui', 'email', 'realtime'],
    template: 'Task "{{task.title}}" review status changed to "{{newStatus}}"',
    enabled: true
  },
  {
    id: 'task-moved',
    name: 'Task Moved',
    description: 'Triggered when a task is moved between columns',
    event: 'taskMoved',
    channels: ['ui', 'realtime'],
    template: 'Task "{{task.title}}" was moved to "{{newColumn}}"',
    enabled: true
  },
  {
    id: 'task-assigned',
    name: 'Task Assigned',
    description: 'Triggered when a task is assigned to a user',
    event: 'taskAssigned',
    channels: ['ui', 'email', 'realtime'],
    template: 'You have been assigned to task "{{task.title}}"',
    enabled: true
  },
  {
    id: 'comment-added',
    name: 'Comment Added',
    description: 'Triggered when a comment is added to a task',
    event: 'commentAdded',
    channels: ['ui', 'realtime'],
    template: 'New comment on task "{{task.title}}": "{{comment}}"',
    enabled: true
  },
  {
    id: 'lock-acquired',
    name: 'Lock Acquired',
    description: 'Triggered when a task edit lock is acquired',
    event: 'lockAcquired',
    channels: ['ui'],
    template: 'User "{{user.name}}" is now editing task "{{task.title}}"',
    enabled: true
  },
  {
    id: 'offline-queue-merged',
    name: 'Offline Queue Merged',
    description: 'Triggered when offline changes are merged',
    event: 'offlineQueueMerged',
    channels: ['ui'],
    template: 'Your offline changes to task "{{task.title}}" have been synchronized',
    enabled: true
  }
];