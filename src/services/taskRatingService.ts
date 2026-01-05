import { apiClient } from '@/lib/apiClient';
import { Task } from '@/types/task';
import { TaskRating, UserPerformanceStats } from '@/types/taskRating';

/**
 * Task Rating Service
 * 
 * Handles task rating functionality including permissions, submission, and stats aggregation.
 */
export const TaskRatingService = {
    /**
     * Check if current user can rate the given task
     */
    canRateTask: async (
        task: Task,
        currentUser: { uid: string; role?: string }
    ): Promise<boolean> => {
        // Task must be completed
        if (task.status !== 'done') {
            return false;
        }

        // Task must not already have a rating
        if (task.rating) {
            return false;
        }

        // User must be admin OR task creator
        const isAdmin = currentUser.role === 'admin';
        const isCreator = task.createdBy?.uid === currentUser.uid;

        if (!isAdmin && !isCreator) {
            return false;
        }

        // User cannot be an assignee (can't rate own work)
        const isAssignee = task.assignedTo?.some(
            assignee => assignee.uid === currentUser.uid
        );

        if (isAssignee) {
            return false;
        }

        return true;
    },

    /**
     * Submit a rating for a task
     */
    rateTask: async (
        taskId: string,
        stars: number,
        comment: string | undefined,
        currentUser: { uid: string; name: string; role: string }
    ): Promise<void> => {
        // Validate stars
        if (stars < 1 || stars > 5 || !Number.isInteger(stars)) {
            throw new Error('Stars must be an integer between 1 and 5');
        }

        // Validate comment length
        if (comment && comment.length > 500) {
            throw new Error('Comment cannot exceed 500 characters');
        }

        try {
            // Get task document to verify permissions and get assignee info
            const task = await apiClient(`/api/tasks/${taskId}`, {
                method: 'GET'
            });

            if (!task) {
                throw new Error('Task not found');
            }

            // Double-check permissions
            const canRate = await TaskRatingService.canRateTask(task, currentUser);
            if (!canRate) {
                throw new Error('You do not have permission to rate this task');
            }

            // Create rating object
            const rating: TaskRating = {
                stars,
                comment: comment?.trim() || undefined,
                ratedBy: {
                    uid: currentUser.uid,
                    name: currentUser.name,
                    role: currentUser.role
                },
                ratedAt: new Date().toISOString() // Send as ISO string
            };

            // Update task with rating
            await apiClient(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    rating: rating as any,
                    updatedAt: new Date().toISOString() // Send as ISO string
                })
            });

            // Update user performance stats (client-side aggregation)
            if (task.assignedTo && task.assignedTo.length > 0) {
                await TaskRatingService.updatePerformanceStats(
                    task.assignedTo[0].uid,
                    stars
                );
            }

        } catch (error) {
            console.error('Error rating task:', error);
            throw error;
        }
    },

    /**
     * Get rating for a task (if exists)
     */
    getTaskRating: async (taskId: string): Promise<TaskRating | null> => {
        try {
            const task = await apiClient(`/api/tasks/${taskId}`, {
                method: 'GET'
            });

            return task?.rating || null;
        } catch (error) {
            console.error('Error getting task rating:', error);
            return null;
        }
    },

    /**
     * Update user performance stats (client-side aggregation)
     */
    updatePerformanceStats: async (
        userId: string,
        stars: number
    ): Promise<void> => {
        try {
            const year = new Date().getFullYear();
            
            const stats = await apiClient(`/api/user-performance-stats/${userId}/${year}`, {
                method: 'GET'
            });

            if (stats) {
                // Update existing stats
                const newTotalRatedTasks = stats.totalRatedTasks + 1;
                const newTotalStars = stats.totalStars + stars;
                const newAverageRating = newTotalStars / newTotalRatedTasks;

                const updatedDistribution = { ...stats.ratingDistribution };
                updatedDistribution[stars as keyof typeof updatedDistribution] += 1;

                await apiClient(`/api/user-performance-stats/${userId}/${year}`, {
                    method: 'PATCH',
                    body: JSON.stringify({
                        totalRatedTasks: newTotalRatedTasks,
                        totalStars: newTotalStars,
                        averageRating: newAverageRating,
                        ratingDistribution: updatedDistribution,
                        lastUpdated: new Date().toISOString() // Send as ISO string
                    })
                });
            } else {
                // Create new stats document
                const newStats: UserPerformanceStats = {
                    uid: userId,
                    year,
                    totalTasksCompleted: 1,
                    totalRatedTasks: 1,
                    totalStars: stars,
                    averageRating: stars,
                    ratingDistribution: {
                        1: stars === 1 ? 1 : 0,
                        2: stars === 2 ? 1 : 0,
                        3: stars === 3 ? 1 : 0,
                        4: stars === 4 ? 1 : 0,
                        5: stars === 5 ? 1 : 0
                    },
                    lastUpdated: new Date().toISOString() // Send as ISO string
                };

                await apiClient('/api/user-performance-stats', {
                    method: 'POST',
                    body: JSON.stringify(newStats)
                });
            }
        } catch (error) {
            // Stats update failure should not block rating submission
            console.warn('Failed to update performance stats:', error);
        }
    },

    /**
     * Get user performance stats
     */
    getUserStats: async (userId: string, year?: number): Promise<UserPerformanceStats | null> => {
        try {
            const targetYear = year || new Date().getFullYear();
            
            const stats = await apiClient(`/api/user-performance-stats/${userId}/${targetYear}`, {
                method: 'GET'
            });

            return stats || null;
        } catch (error) {
            console.error('Error getting user stats:', error);
            return null;
        }
    }
};