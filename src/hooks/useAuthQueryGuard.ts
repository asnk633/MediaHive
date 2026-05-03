import { useAuth } from "@/contexts/AuthContextProvider";

/**
 * useAuthQueryGuard
 *
 * Returns a `canFetch` boolean that is only true once auth has fully
 * initialized AND a valid user session exists.
 *
 * Use this as the `enabled` flag in React Query hooks to prevent
 * premature API calls that cause Unauthorized (401) errors.
 *
 * Usage:
 *   const { canFetch } = useAuthQueryGuard()
 *   useQuery({ queryKey: ['tasks'], queryFn: fetchTasks, enabled: canFetch })
 */
export function useAuthQueryGuard() {
    const { user } = useAuth();

    return {
        user,
        canFetch: !!user,
    };
}
