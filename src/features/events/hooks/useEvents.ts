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
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.institution_id;

    return useQuery({
        queryKey: ['events', workspaceId],
        queryFn: async () => {
            console.log("[DATA TRACE] useEvents fetching via CanonicalDataService");
            // CanonicalDataService handle tenant wrapping and direct Supabase calls
            const events = await CanonicalDataService.getEvents({
                institutionId: workspaceId
            });
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
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.institution_id;

    return useMutation({
        mutationFn: (event: Partial<Event>) => EventService.addEvent(event as any),
        onMutate: async (newEvent) => {
            await queryClient.cancelQueries({ queryKey: ['events', workspaceId] });
            const previousEvents = queryClient.getQueryData<Event[]>(['events', workspaceId]);

            if (previousEvents) {
                const optimisticEvent = {
                    ...newEvent,
                    id: `temp-${Date.now()}`,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                } as Event;
                queryClient.setQueryData(['events'], [optimisticEvent, ...previousEvents]);
            }

            return { previousEvents };
        },
        onError: (err, newEvent, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['events', workspaceId], context.previousEvents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['events', workspaceId] });
        },
    });
}

export function useUpdateEvent() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.institution_id;

    return useMutation({
        mutationFn: ({ id, updates }: { id: string; updates: Partial<Event> }) =>
            EventService.updateEvent(id, updates, user?.uid || ''),
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey: ['events', workspaceId] });
            const previousEvents = queryClient.getQueryData<Event[]>(['events', workspaceId]);

            if (previousEvents) {
                queryClient.setQueryData(['events', workspaceId], (old: Event[] | undefined) =>
                    old?.map(event => event.id === id ? { ...event, ...updates } : event)
                );
            }

            return { previousEvents };
        },
        onError: (err, variables, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['events', workspaceId], context.previousEvents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['events', workspaceId] });
        },
    });
}

export function useDeleteEvent() {
    const queryClient = useQueryClient();
    const { currentWorkspace } = useWorkspace();
    const workspaceId = currentWorkspace?.institution_id;

    return useMutation({
        mutationFn: (id: string) => EventService.deleteEvent(id),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['events', workspaceId] });
            const previousEvents = queryClient.getQueryData<Event[]>(['events', workspaceId]);

            if (previousEvents) {
                queryClient.setQueryData(['events', workspaceId], (old: Event[] | undefined) =>
                    old?.filter(event => event.id !== id)
                );
            }

            return { previousEvents };
        },
        onError: (err, id, context) => {
            if (context?.previousEvents) {
                queryClient.setQueryData(['events', workspaceId], context.previousEvents);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['events', workspaceId] });
        },
    });
}
