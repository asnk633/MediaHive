import 'server-only';
import { Task } from '@/types/task';
import { differenceInDays, differenceInHours } from 'date-fns';

export interface SmartMetadata {
    inferredStage: 'shoot' | 'edit' | 'review' | 'publish' | 'intake';
    isStale: boolean;
    daysInStatus: number;
    urgencyScore: number;
    normalizedProvenance: string;
    needsAttention: boolean;
    isBlocked: boolean;
}

export class SmartRulesEngineServer {

    /**
     * Infer the media production stage based on task keywords, status, and department.
     */
    static inferStage(task: Task): SmartMetadata['inferredStage'] {
        // 1. Explicit Stage Field (Future proofing, assuming task might have 'stage' field later)
        if ((task as any).stage) {
            return (task as any).stage;
        }

        const titleLower = task.title.toLowerCase();

        // 2. Inferred Lists

        // Review Detection (High Priority via Status)
        if (task.status === 'review' || titleLower.includes('review') || titleLower.includes('feedback') || titleLower.includes('approve')) {
            return 'review';
        }

        // Shoot Detection
        if (titleLower.includes('shoot') || titleLower.includes('recording') || titleLower.includes('film') || titleLower.includes('production')) {
            return 'shoot';
        }

        // Edit Detection
        if (titleLower.includes('edit') || titleLower.includes('cut') || titleLower.includes('render') || titleLower.includes('post')) {
            return 'edit';
        }

        // Publish Detection
        if (titleLower.includes('publish') || titleLower.includes('upload') || titleLower.includes('release') || titleLower.includes('export')) {
            return 'publish';
        }

        // 3. Fallback -> Intake
        return 'intake';
    }

    /**
     * Calculate staleness and "needs attention" flags.
     */
    static checkStaleness(task: Task): { isStale: boolean; daysInStatus: number } {
        const now = new Date();
        const updatedAt = task.updatedAt || task.createdAt;

        let lastUpdateDate: Date;

        try {
            // Handle Firestore Timestamp or ISO string
            lastUpdateDate = (updatedAt as any).seconds
                ? new Date((updatedAt as any).seconds * 1000)
                : new Date(updatedAt);
        } catch (e) {
            lastUpdateDate = now;
        }

        const daysInStatus = differenceInDays(now, lastUpdateDate);

        // Definition of Stale:
        // - "In Progress" for > 5 days
        // - "Review" for > 3 days
        // - "Todo" for > 14 days
        // - "On Hold" for > 30 days

        let isStale = false;
        if (task.status === 'in_progress' && daysInStatus > 5) isStale = true;
        else if (task.status === 'review' && daysInStatus > 3) isStale = true;
        else if (task.status === 'todo' && daysInStatus > 14) isStale = true;
        else if (task.status === 'on_hold' && daysInStatus > 30) isStale = true;

        return { isStale, daysInStatus };
    }

    /**
     * Calculate urgency score (0-100).
     */
    static calculateUrgency(task: Task): number {
        if (task.status === 'done') return 0;

        let score = 0;
        const now = new Date();

        // 1. Priority Basis
        switch (task.priority) {
            case 'urgent': score += 40; break;
            case 'high': score += 30; break;
            case 'medium': score += 15; break;
            case 'low': score += 0; break;
        }

        // 2. Due Date Basis
        if (task.dueDate) {
            let dueDate: Date;
            try {
                dueDate = (task.dueDate as any).seconds
                    ? new Date((task.dueDate as any).seconds * 1000)
                    : new Date(task.dueDate);
            } catch (e) {
                return score;
            }

            const hoursToDue = differenceInHours(dueDate, now);

            if (hoursToDue < 0) {
                // Overdue
                score += 50;
            } else if (hoursToDue <= 24) {
                // Due in 24h
                score += 40;
            } else if (hoursToDue <= 48) {
                // Due in 48h
                score += 25;
            } else if (hoursToDue <= 168) { // 7 days
                score += 10;
            }
        }

        return Math.min(score, 100);
    }

    /**
     * Normalize Creator/Provenance
     */
    static normalizeProvenance(task: Task): string {
        if (!task.createdBy) return "System (Legacy)";

        const createdBy = task.createdBy;
        if (typeof createdBy === 'string') return "Unknown User"; // Legacy string ID

        if (!createdBy.name || createdBy.name === 'Unknown') {
            // Try to infer based on assignment or fallback
            if (task.assignedBy?.name && task.assignedBy.name !== 'Unknown') {
                return `${task.assignedBy.name} (Assigned)`;
            }
            return "System (Legacy)";
        }

        return createdBy.name;
    }

    /**
     * Detect if task needs attention
     */
    static checkNeedsAttention(task: Task, isStale: boolean, urgencyScore: number): boolean {
        if (task.status === 'done') return false;

        // Critical Conditions
        if (isStale) return true;
        if (urgencyScore >= 80) return true;

        // Missing Data conditions (e.g., in progress but no assignee)
        if (task.status === 'in_progress' &&
            (!task.assignedTo || (Array.isArray(task.assignedTo) && task.assignedTo.length === 0))) {
            return true;
        }

        return false;
    }


    /**
     * Check if the task is blocked based on stage prerequisites.
     */
    static checkBlocked(task: Task, inferredStage: SmartMetadata['inferredStage']): boolean {
        // Rule 1: Edit Stage requires deliverables
        if (inferredStage === 'edit') {
            if (!task.firstDeliverableAt) return true;
        }

        // Rule 2: Review Stage requires deliverables
        if (inferredStage === 'review') {
            if (!task.firstDeliverableAt) return true;
        }

        // Rule 3: Publish Stage requires approval (if approval workflow is active)
        if (inferredStage === 'publish') {
            // Block if approvalStatus exists but is NOT approved
            if (task.approvalStatus && task.approvalStatus !== 'approved') {
                return true;
            }
        }

        return false;
    }

    /**
     * Public convenience method for isBlocked
     */
    static isTaskBlocked(task: Task): boolean {
        const stage = this.inferStage(task);
        return this.checkBlocked(task, stage);
    }

    /**
     * Main Process Function
     */
    static processTask(task: Task): SmartMetadata {
        const inferredStage = this.inferStage(task);
        const { isStale, daysInStatus } = this.checkStaleness(task);
        const urgencyScore = this.calculateUrgency(task);
        const normalizedProvenance = this.normalizeProvenance(task);
        const needsAttention = this.checkNeedsAttention(task, isStale, urgencyScore);
        const isBlocked = this.checkBlocked(task, inferredStage);

        return {
            inferredStage,
            isStale,
            daysInStatus,
            urgencyScore,
            normalizedProvenance,
            needsAttention,
            isBlocked
        };
    }
}
