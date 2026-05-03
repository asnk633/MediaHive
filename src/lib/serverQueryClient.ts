import { QueryClient } from "@tanstack/react-query";

/**
 * createServerQueryClient
 * 
 * Creates a fresh QueryClient instance for server-side prefetching.
 * This ensures that each request gets its own isolated cache.
 */
export function createServerQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 60000,
                retry: 1,
            }
        }
    });
}
