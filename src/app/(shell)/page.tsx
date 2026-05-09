import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { createServerQueryClient } from "@/lib/serverQueryClient";
import { TaskService } from "@/services/tasks";
import { EventService } from "@/features/events/services/eventService";
import HomeClient from './home/HomeClient';

/**
 * DashboardPage (Server Component)
 * Prefetches essential dashboard data on the server to eliminate loading flickers.
 */
export default async function DashboardPage() {
    const queryClient = createServerQueryClient();

    // Prefetch tasks and events in parallel on the server
    await Promise.all([
        queryClient.prefetchQuery({
            queryKey: ["tasks"],
            queryFn: async () => {
                const res = await TaskService.getTasks();
                return res || [];
            },
        }),
        queryClient.prefetchQuery({
            queryKey: ["events"],
            queryFn: async () => {
                const res = await EventService.getEvents();
                return res || [];
            },
        })
    ]);

    const dehydratedState = dehydrate(queryClient);

    return (
        <HydrationBoundary state={dehydratedState}>
            <HomeClient />
        </HydrationBoundary>
    );
}
