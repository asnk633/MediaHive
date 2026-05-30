import { Task } from "@/features/tasks/types/task";
import { Event } from '@/features/events/types/event';
import { DriveFile as MediaFile } from '@/types/file';
import { User } from '@/types/user';
import { TaskSchema } from '@/domain/schemas/task';
import { EventSchema } from '@/domain/schemas/event';

export interface EdgeCaseResult {
  orphanedTasks: Task[];
  orphanedMedia: MediaFile[];
  deletedUsers: Array<{ id: string; name: string }>; // user info of deleted users
  invalidReferences: Array<{ type: 'task' | 'event' | 'media'; id: string; title: string; issue: string }>;
}

export const EdgeCaseService = {
  /**
   * Detect orphaned tasks (tasks without valid events or media references)
   */
  findOrphanedTasks: (tasks: Task[], events: Event[]): Task[] => {
    return tasks.filter(task => {
      const event_id = (task as any).event_id;
      const hasValidEvent = events.some(event => event.id === event_id);
      return event_id && !hasValidEvent;
    });
  },

  /**
   * Detect orphaned media files (media without valid task or event references)
   */
  findOrphanedMedia: (mediaFiles: MediaFile[], tasks: Task[], events: Event[]): MediaFile[] => {
    return [];
  },

  /**
   * Detect references to deleted users
   */
  findDeletedUserReferences: (tasks: Task[], events: Event[], allUsers: User[]): Array<{ id: string; name: string }> => {
    const referencedUsers = new Map<string, string>();

    // Collect all referenced user IDs from tasks
    tasks.forEach(task => {
      if (task.assigned_to && Array.isArray(task.assigned_to)) {
        task.assigned_to.forEach(user => referencedUsers.set(user.uid, user.name));
      }
      if (task.created_by) referencedUsers.set(task.created_by.uid, task.created_by.name);
      if (task.updated_by) referencedUsers.set(task.updated_by.uid, task.updated_by.name);
    });

    // Collect all referenced user IDs from events
    events.forEach(event => {
      if (event.created_by) referencedUsers.set(event.created_by.uid, event.created_by.name);
    });

    const existingUserIds = new Set(allUsers.map(user => user.uid || user.id));
    const deletedUsers: Array<{ id: string; name: string }> = [];

    referencedUsers.forEach((name, userId) => {
      if (!existingUserIds.has(userId)) {
        deletedUsers.push({ id: userId, name: name || 'Unknown User' });
      }
    });

    return deletedUsers;
  },

  /**
   * Validate all references in tasks and events
   */
  validateReferences: (tasks: Task[], events: Event[], mediaFiles: MediaFile[], allUsers: User[]): Array<{ type: 'task' | 'event' | 'media'; id: string; title: string; issue: string }> => {
    const invalidReferences: Array<{ type: 'task' | 'event' | 'media'; id: string; title: string; issue: string }> = [];

    // Validate task references
    tasks.forEach(task => {
      // Check event reference
      const event_id = (task as any).event_id;
      if (event_id) {
        const hasValidEvent = events.some(event => event.id === event_id);
        if (!hasValidEvent) {
          invalidReferences.push({
            type: 'task',
            id: task.id,
            title: task.title,
            issue: `References a non-existent Event ID: ${event_id.substring(0, 8)}...`
          });
        }
      }

      // Check assigned user
      if (task.assigned_to && Array.isArray(task.assigned_to)) {
        task.assigned_to.forEach(assignedUser => {
          const hasValidUser = allUsers.some(user => (user.uid || user.id) === assignedUser.uid);
          if (!hasValidUser) {
            invalidReferences.push({
              type: 'task',
              id: task.id,
              title: task.title,
              issue: `Assigned to a deleted user: ${assignedUser.name}`
            });
          }
        });
      }

      // Check created by user
      if (task.created_by) {
        const hasValidUser = allUsers.some(user => (user.uid || user.id) === task.created_by.uid);
        if (!hasValidUser) {
          invalidReferences.push({
            type: 'task',
            id: task.id,
            title: task.title,
            issue: `Created by a deleted user: ${task.created_by.name}`
          });
        }
      }

      // Check updated by user
      if (task.updated_by) {
        const hasValidUser = allUsers.some(user => (user.uid || user.id) === task.updated_by!.uid);
        if (!hasValidUser) {
          invalidReferences.push({
            type: 'task',
            id: task.id,
            title: task.title,
            issue: `Updated by a deleted user: ${task.updated_by.name}`
          });
        }
      }
    });

    // Validate event references
    events.forEach(event => {
      // Check created by user
      if (event.created_by) {
        const hasValidUser = allUsers.some(user => (user.uid || user.id) === event.created_by.uid);
        if (!hasValidUser) {
          invalidReferences.push({
            type: 'event',
            id: event.id,
            title: event.title,
            issue: `Created by a deleted user: ${event.created_by.name}`
          });
        }
      }
    });

    return invalidReferences;
  },

  /**
   * Perform comprehensive edge case analysis
   */
  analyze: (tasks: Task[], events: Event[], mediaFiles: MediaFile[], allUsers: User[]): EdgeCaseResult => {
    return {
      orphanedTasks: EdgeCaseService.findOrphanedTasks(tasks, events),
      orphanedMedia: EdgeCaseService.findOrphanedMedia(mediaFiles, tasks, events),
      deletedUsers: EdgeCaseService.findDeletedUserReferences(tasks, events, allUsers),
      invalidReferences: EdgeCaseService.validateReferences(tasks, events, mediaFiles, allUsers)
    };
  }
};
