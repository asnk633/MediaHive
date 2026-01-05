import { Task } from '@/types/task';
import { Event } from '@/types/event';
import { DriveFile as MediaFile } from '@/types/file';
import { User } from '@/types/user';

export interface EdgeCaseResult {
  orphanedTasks: Task[];
  orphanedMedia: MediaFile[];
  deletedUsers: string[]; // userIds of deleted users
  invalidReferences: Array<{ type: 'task' | 'event' | 'media'; id: string; issue: string }>;
}

export const EdgeCaseService = {
  /**
   * Detect orphaned tasks (tasks without valid events or media references)
   * @param tasks - Array of tasks to check
   * @param events - Array of events to check against
   * @returns Array of orphaned tasks
   */
  findOrphanedTasks: (tasks: Task[], events: Event[]): Task[] => {
    return tasks.filter(task => {
      // Check if the task's event reference exists
      const hasValidEvent = events.some(event => event.id === task.eventId);

      // For tasks that should be linked to events, consider them orphaned if no valid event exists
      return task.eventId && !hasValidEvent;
    });
  },

  /**
   * Detect orphaned media files (media without valid task or event references)
   * @param mediaFiles - Array of media files to check
   * @param tasks - Array of tasks to check against
   * @param events - Array of events to check against
   * @returns Array of orphaned media files
   */
  findOrphanedMedia: (mediaFiles: MediaFile[], tasks: Task[], events: Event[]): MediaFile[] => {
    return mediaFiles.filter(media => {
      // Media files are typically linked to events via event media galleries
      // Since DriveFile doesn't have explicit taskId or eventId, we'll consider them
      // orphaned if they're not associated with any specific event in the system
      // For now, we'll consider all media files as potentially orphaned
      // since there's no direct linking mechanism in the DriveFile type
      
      // In a real implementation, you would check if the media is referenced
      // somewhere in your system, but based on the DriveFile type, there's no
      // direct reference to tasks or events
      
      // For this implementation, return an empty array as we can't determine
      // orphaned status without explicit references in the DriveFile type
      return false;
    });
  },

  /**
   * Detect references to deleted users
   * @param tasks - Array of tasks to check
   * @param events - Array of events to check
   * @param allUsers - Array of all known users
   * @returns Array of user IDs that are referenced but don't exist
   */
  findDeletedUserReferences: (tasks: Task[], events: Event[], allUsers: User[]): string[] => {
    const referencedUserIds = new Set<string>();

    // Collect all referenced user IDs from tasks
    tasks.forEach(task => {
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach(user => referencedUserIds.add(user.uid));
      }
      if (task.createdBy) referencedUserIds.add(task.createdBy.uid);
      if (task.updatedBy) referencedUserIds.add(task.updatedBy.uid);
    });

    // Collect all referenced user IDs from events
    events.forEach(event => {
      if (event.createdBy) referencedUserIds.add(event.createdBy.uid);
    });

    // Find user IDs that are referenced but don't exist in the user list
    const existingUserIds = new Set(allUsers.map(user => user.uid));
    const deletedUserIds: string[] = [];

    referencedUserIds.forEach(userId => {
      if (!existingUserIds.has(userId)) {
        deletedUserIds.push(userId);
      }
    });

    return deletedUserIds;
  },

  /**
   * Validate all references in tasks and events
   * @param tasks - Array of tasks to check
   * @param events - Array of events to check
   * @param mediaFiles - Array of media files to check
   * @param allUsers - Array of all known users
   * @returns Array of invalid references
   */
  validateReferences: (tasks: Task[], events: Event[], mediaFiles: MediaFile[], allUsers: User[]): Array<{ type: 'task' | 'event' | 'media'; id: string; issue: string }> => {
    const invalidReferences: Array<{ type: 'task' | 'event' | 'media'; id: string; issue: string }> = [];

    // Validate task references
    tasks.forEach(task => {
      // Check event reference
      if (task.eventId) {
        const hasValidEvent = events.some(event => event.id === task.eventId);
        if (!hasValidEvent) {
          invalidReferences.push({
            type: 'task',
            id: task.id,
            issue: `Task ${task.id} references non-existent event ${task.eventId}`
          });
        }
      }

      // Check assigned user
      if (task.assignedTo && Array.isArray(task.assignedTo)) {
        task.assignedTo.forEach(assignedUser => {
          const hasValidUser = allUsers.some(user => user.uid === assignedUser.uid);
          if (!hasValidUser) {
            invalidReferences.push({
              type: 'task',
              id: task.id,
              issue: `Task ${task.id} assigned to non-existent user ${assignedUser.uid}`
            });
          }
        });
      }

      // Check created by user
      if (task.createdBy) {
        const hasValidUser = allUsers.some(user => user.uid === task.createdBy.uid);
        if (!hasValidUser) {
          invalidReferences.push({
            type: 'task',
            id: task.id,
            issue: `Task ${task.id} created by non-existent user ${task.createdBy.uid}`
          });
        }
      }

      // Check updated by user
      if (task.updatedBy) {
        const hasValidUser = allUsers.some(user => user.uid === task.updatedBy!.uid);
        if (!hasValidUser) {
          invalidReferences.push({
            type: 'task',
            id: task.id,
            issue: `Task ${task.id} updated by non-existent user ${task.updatedBy.uid}`
          });
        }
      }
    });

    // Validate event references
    events.forEach(event => {
      // Check created by user
      if (event.createdBy) {
        const hasValidUser = allUsers.some(user => user.uid === event.createdBy.uid);
        if (!hasValidUser) {
          invalidReferences.push({
            type: 'event',
            id: event.id,
            issue: `Event ${event.id} created by non-existent user ${event.createdBy.uid}`
          });
        }
      }
    });

    // Validate media references
    // Since DriveFile type doesn't include taskId or eventId properties,
    // we cannot validate media references to tasks or events
    // This section is left as a placeholder for when the DriveFile type is updated

    return invalidReferences;
  },

  /**
   * Perform comprehensive edge case analysis
   * @param tasks - Array of tasks
   * @param events - Array of events
   * @param mediaFiles - Array of media files
   * @param allUsers - Array of all known users
   * @returns EdgeCaseResult with all detected issues
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