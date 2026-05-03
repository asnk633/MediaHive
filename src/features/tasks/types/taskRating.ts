import { TimestampLike } from '@/types/timestamp';

/**
 * Task Rating Type Definitions
 */

export interface TaskRating {
    stars: number; // 1-5
    comment?: string; // Optional feedback (max 500 chars)
    ratedBy: {
        uid: string;
        name: string;
        role: string;
    };
    ratedAt: TimestampLike;
}

export interface UserPerformanceStats {
    uid: string;
    year: number;
    totalTasksCompleted: number;
    totalRatedTasks: number;
    totalStars: number;
    averageRating: number; // totalStars / totalRatedTasks
    ratingDistribution: {
        1: number;
        2: number;
        3: number;
        4: number;
        5: number;
    };
    lastUpdated: TimestampLike;
}
