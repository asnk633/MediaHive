/**
 * Phase 8B: React Hook for Persistent Conflicts
 * 
 * Provides React integration for the persistent conflict store
 * with proper state management and lifecycle handling.
 */

import { useState, useEffect } from 'react';
import { conflictStore, PersistentConflict, ConflictQueryOptions, ConflictResolution, ConflictStatus } from '@/lib/conflictStore';

export function usePersistentConflicts(initialQuery?: ConflictQueryOptions) {
  const [conflicts, setConflicts] = useState<PersistentConflict[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [query, setQuery] = useState<ConflictQueryOptions>(initialQuery || {});

  // Initialize the conflict store
  useEffect(() => {
    const initializeStore = async () => {
      try {
        await conflictStore.initialize();
        await refreshConflicts();
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize conflict store'));
      } finally {
        setLoading(false);
      }
    };

    initializeStore();
  }, []);

  // Refresh conflicts based on current query
  const refreshConflicts = async () => {
    try {
      setLoading(true);
      const fetchedConflicts = await conflictStore.getConflicts(query);
      setConflicts(fetchedConflicts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conflicts'));
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  // Update query and refresh
  const updateQuery = async (newQuery: ConflictQueryOptions) => {
    setQuery(newQuery);
    try {
      setLoading(true);
      const fetchedConflicts = await conflictStore.getConflicts(newQuery);
      setConflicts(fetchedConflicts);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch conflicts'));
      setConflicts([]);
    } finally {
      setLoading(false);
    }
  };

  // Get count of unresolved conflicts
  const getUnresolvedCount = async (): Promise<number> => {
    try {
      return await conflictStore.getUnresolvedCount();
    } catch (err) {
      console.error('Failed to get unresolved conflict count:', err);
      return 0;
    }
  };

  // Resolve a specific conflict
  const resolveConflict = async (id: string, resolution: ConflictResolution, resolvedBy: string) => {
    try {
      const success = await conflictStore.resolveConflict(id, resolution, resolvedBy);
      if (success) {
        await refreshConflicts(); // Refresh the list after resolving
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to resolve conflict'));
      return false;
    }
  };

  // Update conflict status
  const updateConflictStatus = async (id: string, status: ConflictStatus, actor?: string, details?: string) => {
    try {
      const success = await conflictStore.updateConflictStatus(id, status, actor, details);
      if (success) {
        await refreshConflicts(); // Refresh the list after updating
      }
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update conflict status'));
      return false;
    }
  };

  // Mark conflicts as surfaced
  const markAsSurfaced = async (ids: string[], actor?: string) => {
    try {
      await conflictStore.markAsSurfaced(ids, actor);
      await refreshConflicts(); // Refresh the list after marking as surfaced
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to mark conflicts as surfaced'));
    }
  };

  // Get conflicts for surfacing to user
  const getConflictsForSurfacing = async (): Promise<PersistentConflict[]> => {
    try {
      return await conflictStore.getConflictsForSurfacing();
    } catch (err) {
      console.error('Failed to get conflicts for surfacing:', err);
      return [];
    }
  };

  return {
    conflicts,
    loading,
    error,
    query,
    refreshConflicts,
    updateQuery,
    resolveConflict,
    updateConflictStatus,
    markAsSurfaced,
    getUnresolvedCount,
    getConflictsForSurfacing
  };
}
