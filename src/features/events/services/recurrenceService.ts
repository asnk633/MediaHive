import { RRule, rrulestr } from 'rrule';
import { Event } from '../types/event';

/**
 * RecurrenceService
 * Handles expansion of recurring events using RFC 5545 (rrule)
 */
export const RecurrenceService = {
    /**
     * Expands recurring events within a given date range
     */
    expandEvents: (events: Event[], start: Date, end: Date): Event[] => {
        const expanded: Event[] = [];
        
        // 1. Group exceptions by parent series ID
        const exceptionsBySeries: Record<string, Set<string>> = {};
        events.forEach(e => {
            if (e.parent_event_id && e.recurrence_exception_date) {
                const seriesId = e.parent_event_id;
                if (!exceptionsBySeries[seriesId]) exceptionsBySeries[seriesId] = new Set();
                // Store date string for easy comparison
                exceptionsBySeries[seriesId].add(new Date(e.recurrence_exception_date).toDateString());
            }
        });

        events.forEach(event => {
            if (event.is_recurring && event.recurrence_rule) {
                try {
                    const rule = rrulestr(event.recurrence_rule);
                    const occurrences = rule.between(start, end, true);
                    const seriesExceptions = exceptionsBySeries[event.id] || new Set();

                    occurrences.forEach(date => {
                        const instanceStart = new Date(date);
                        const originalStart = new Date(event.start_at);
                        instanceStart.setHours(originalStart.getHours(), originalStart.getMinutes(), originalStart.getSeconds());

                        // SKIP if this date is marked as an exception (modified or deleted instance)
                        if (seriesExceptions.has(instanceStart.toDateString())) {
                            return;
                        }

                        const duration = new Date(event.end_at).getTime() - originalStart.getTime();
                        const instanceEnd = new Date(instanceStart.getTime() + duration);
                        const instanceId = `${event.id}_${instanceStart.getTime()}`;

                        expanded.push({
                            ...event,
                            id: instanceId,
                            start_at: instanceStart.toISOString(),
                            end_at: instanceEnd.toISOString(),
                            is_recurring_instance: true,
                            original_series_id: event.id
                        } as any);
                    });
                } catch (e) {
                    console.error(`[RecurrenceService] Failed to expand event ${event.id}:`, e);
                    expanded.push(event);
                }
            } else {
                // Non-recurring event (including exception events)
                const eventStart = new Date(event.start_at);
                if (eventStart >= start && eventStart <= end) {
                    expanded.push(event);
                }
            }
        });

        return expanded;
    },

    /**
     * Generates an RRULE string from common parameters
     */
    generateRuleString: (options: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        startDate: Date;
        until?: Date;
        count?: number;
        byweekday?: any[];
    }): string => {
        const freqMap: Record<string, any> = {
            daily: RRule.DAILY,
            weekly: RRule.WEEKLY,
            monthly: RRule.MONTHLY,
            yearly: RRule.YEARLY
        };

        const rule = new RRule({
            freq: freqMap[options.frequency],
            interval: options.interval,
            dtstart: options.startDate,
            until: options.until,
            count: options.count,
            byweekday: options.byweekday
        });

        return rule.toString();
    }
};
