import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContextProvider';
import { Event } from '@/features/events/types/event';
import { useAuthQueryGuard } from '@/hooks/useAuthQueryGuard';
import { EventService } from '@/features/events/services/eventService';
import { useWorkspace } from '@/system/workspace/WorkspaceProvider';
import { CanonicalDataService } from '@/services/canonicalDataService';

/**
 * useEvents Hook
 * Uses CanonicalDataService for direct Supabase access via React Query.
 */
export function useEvents() {
    const { canFetch } = useAuthQueryGuard();

    return useQuery({
        queryKey: ['events', 'global'],
        queryFn: async () => {
            console.log("[DATA TRACE] useEvents fetching via CanonicalDataService (Global)");
            // CanonicalDataService now ignores institutionId internally, but we'll stop passing it here too
            const events = await CanonicalDataService.getEvents({});
            return events || [];
        },
        enabled: canFetch,
        staleTime: 60000,
        retry: 1,
        refetchOnReconnect: true,
        refetchOnMount: true
    });
}

export function useCreateEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (event: Partial<Event>) => EventService.addEvent(event as any),
        onMutate: async (newEvent) => {
            await queryClient.cancelQueries({ queryKey: ['events', 'global'] });
            const previousEvents = queryClient.getQueryData<Event[]>(['events', 'global']);

            if (previousEvents) {
                const optimisticEvent = {
                    ...newEvent,
                    id: `temp-${Date.now()}`,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                } as Event;
                queryClient.setQueryData(['events', 'global'], [optimisticEvent, ...previousEvents]);
            }

            return { previousEvents };
        },
        onError: (err, newEvent, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['events', 'global'], context.previousEvents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['events', 'global'] });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Event> }) =>
            EventService.updateEvent(id, updates, user?.uid || '', (updates as any).crew, (updates as any).equipment),
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['events', 'global'] });
            const previousEvents = queryClient.getQueryData<Event[]>(['events', 'global']);

            if (previousEvents) {
                queryClient.setQueryData(['events', 'global'], (old: Event[] | undefined) =>
                    old?.map(event => event.id === id ? { ...event, ...updates } : event)
                );
            }

            return { previousEvents };
        },
        onError: (err, variables, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['events', 'global'], context.previousEvents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['events', 'global'] });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => EventService.deleteEvent(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['events', 'global'] });
            const previousEvents = queryClient.getQueryData<Event[]>(['events', 'global']);

            if (previousEvents) {
                queryClient.setQueryData(['events', 'global'], (old: Event[] | undefined) =>
                    old?.filter(event => event.id !== id)
                );
            }

            return { previousEvents };
        },
        onError: (err, id, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['events', 'global'], context.previousEvents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['events', 'global'] });
        },
    });
}
