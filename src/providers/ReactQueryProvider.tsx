import { QueryClient, QueryClientProvider, QueryCache, MutationCache } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client"
import { reactQueryPersister } from "@/lib/reactQueryPersister"
import { handleQueryError } from "@/lib/queryErrorHandler"
import { ReactNode } from "react"
import { logPerformance } from "@/system/performanceLogger"
import { devMonitor } from "@/system/devMonitor"

// Track query start times
const queryStartTimes = new Map<string, number>();

export const queryClient = new QueryClient({
    queryCache: new QueryCache({
        onSuccess: (data, query) => {
            const start = queryStartTimes.get(query.queryHash);
            if (start) {
                const duration = logPerformance(`Query: ${query.queryKey.join('/')}`, start, {
                    isStale: query.isStale(),
                    status: query.state.status
                });
                if (duration) devMonitor.recordMetric(`Query: ${query.queryKey[0]}`, duration);
                queryStartTimes.delete(query.queryHash);
            }
        },
        onError: (error, query) => {
            handleQueryError(error);
            queryStartTimes.delete(query.queryHash);
        },
    }),
    mutationCache: new MutationCache({
        onMutate: (variables, mutation) => {
            (mutation as any).startTime = performance.now();
        },
        onSuccess: (data, variables, context, mutation) => {
            const start = (mutation as any).startTime;
            if (start) {
                const duration = logPerformance(`Mutation: ${mutation.options.mutationKey?.join('/') || 'unknown'}`, start);
                if (duration) devMonitor.recordMetric('Mutation', duration);
            }
        },
        onError: (error) => handleQueryError(error),
    }),
    defaultOptions: {
        queries: {
            staleTime: 60000,
            gcTime: 1000 * 60 * 10,
            retry: 2,
            retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000), // Exponential backoff
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
            refetchOnMount: false,
            // Add timing start point
            placeholderData: (previousData: any) => {
                // This is a quirk to get a hook into query start globally
                return previousData;
            }
        },
        mutations: {
            retry: 1
        }
    }
})

// Global subscriber to catch query starts
queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'added' || event.type === 'updated' && event.action.type === 'fetch') {
        if (!queryStartTimes.has(event.query.queryHash)) {
            queryStartTimes.set(event.query.queryHash, performance.now());
        }
    }
});

export function ReactQueryProvider({ children }: { children: ReactNode }) {

    if (!reactQueryPersister) {
        return (
            <QueryClientProvider client={queryClient}>
                {children}
                {process.env.NODE_ENV === 'development' && (
                    <ReactQueryDevtools initialIsOpen={false} />
                )}
            </QueryClientProvider>
        )
    }

    return (
        <PersistQueryClientProvider
            client={queryClient}
            persistOptions={{
                persister: reactQueryPersister,
                maxAge: 1000 * 60 * 5
            }}
        >
            {children}
            {process.env.NODE_ENV === 'development' && (
                <ReactQueryDevtools initialIsOpen={false} />
            )}
        </PersistQueryClientProvider>
    )
}
