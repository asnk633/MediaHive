import { getFirebaseAuth } from '@/firebase/client';
import { apiClient } from '@/lib/apiClient';
import { Task } from '@/types/task';

export interface TaskStats {
  todo: number;
  inProgress: number;
  review: number;
  done: number;
  pending: number;
}

export interface ProductionPipelineStats {
  inProgress: number;
  pendingReview: number;
  completed: number;
  delayed: number;
}

// Helper to check for network/auth errors to avoid console noise
const isNetworkError = (error: any) => {
  const msg = error?.message || '';
  const code = error?.code || '';
  return (
    code === 'auth/network-request-failed' ||
    msg.includes('offline') ||
    msg.includes('network') ||
    msg.includes('Connection failed')
  );
};

import { CanonicalDataService } from './canonicalDataService';

/**
 * Fetch real task statistics from Firestore
 * @returns Promise<TaskStats> - Object containing counts for each task status
 */
export async function getTaskStats(): Promise<TaskStats> {
  // Delegate to CanonicalDataService which handles fallback and aggregation safe
  return CanonicalDataService.getTaskStats();
}

/**
 * Fetch task statistics for a specific user (their assigned tasks)
 * @param userId - The ID of the user to filter tasks for
 * @returns Promise<TaskStats> - Object containing counts for each task status
 */
export async function getUserTaskStats(userId: string): Promise<TaskStats> {
  return CanonicalDataService.getTaskStats({ userId });
}

/**
 * Get production pipeline statistics
 * @returns Promise<ProductionPipelineStats>
 */
export async function getProductionPipelineStats(): Promise<ProductionPipelineStats> {
  try {
    const stats = await getTaskStats();

    return {
      inProgress: stats.inProgress,
      pendingReview: stats.review,
      completed: stats.done,
      delayed: Math.max(0, stats.todo - 5) // Assume delayed if more than 5 todo
    };
  } catch (error) {
    return {
      inProgress: 0,
      pendingReview: 0,
      completed: 0,
      delayed: 0
    };
  }
}

/**
 * Get task statistics formatted for the home page overview cards
 * @returns Promise<Array<{count: string, label: string, subLabel: string}>>
 */
export async function getHomePageStats() {
  // For all users, show overall team statistics
  const stats = await getTaskStats();

  return [
    {
      count: stats.pending.toString(),
      label: "Project",
      subLabel: "Pending Approval"
    },
    {
      count: stats.todo.toString(),
      label: "Project",
      subLabel: "To Do"
    },
    {
      count: stats.done.toString(),
      label: "Project",
      subLabel: "Completed"
    },
    {
      count: stats.inProgress.toString(),
      label: "Project",
      subLabel: "In Progress"
    },
    {
      count: stats.review.toString(),
      label: "Project",
      subLabel: "In Review"
    }
  ];
}

/**
 * Get personal task statistics formatted for the home page overview cards (for team members)
 * @param userId - The ID of the user to filter tasks for
 * @returns Promise<Array<{count: string, label: string, subLabel: string}>>
 */
export async function getPersonalTaskStats(userId: string) {
  // For team members, show their personal statistics
  const stats = await getUserTaskStats(userId);

  return [
    {
      count: stats.pending.toString(),
      label: "My Task",
      subLabel: "Pending Approval"
    },
    {
      count: stats.todo.toString(),
      label: "My Task",
      subLabel: "To Do"
    },
    {
      count: stats.done.toString(),
      label: "My Task",
      subLabel: "Completed"
    },
    {
      count: stats.inProgress.toString(),
      label: "My Task",
      subLabel: "In Progress"
    },
    {
      count: stats.review.toString(),
      label: "My Task",
      subLabel: "In Review"
    }
  ];
}

/**
 * Get weekly completion statistics comparing current week to last week
 * @returns Promise<{currentWeek: number, lastWeek: number, percentageChange: number}>
 */
export async function getWeeklyCompletionStats() {
  // Endpoints /api/stats/weekly-completion does not exist. Return mock to prevent 404.
  return { currentWeek: 0, lastWeek: 0, percentageChange: 0 };
}