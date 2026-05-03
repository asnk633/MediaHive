import { useState, useCallback, useMemo } from 'react';

export interface UseBulkSelectionOptions<T extends string | number> {
    allIds: T[];
}

export interface UseBulkSelectionReturn<T extends string | number> {
    selectedIds: ReadonlySet<T>;
    isSelected: (id: T) => boolean;
    isAllSelected: boolean;
    isIndeterminate: boolean;
    select: (id: T) => void;
    deselect: (id: T) => void;
    toggle: (id: T) => void;
    clear: () => void;
    selectAll: () => void;
    selectRange: (startIndex: number, endIndex: number) => void;
}

/**
 * useBulkSelection — generic multi-selection hook.
 *
 * Rules:
 * - Uses Set<T> for O(1) toggle/lookup
 * - Pure React state — no context, no global state, no side effects
 * - Fully typed, no `any`
 */
export function useBulkSelection<T extends string | number>({
    allIds,
}: UseBulkSelectionOptions<T>): UseBulkSelectionReturn<T> {
    const [selectedSet, setSelectedSet] = useState<Set<T>>(() => new Set<T>());

    // O(1) lookup
    const isSelected = useCallback(
        (id: T): boolean => selectedSet.has(id),
        [selectedSet],
    );

    // Derived flags — stable references via useMemo
    const isAllSelected = useMemo(
        () => allIds.length > 0 && allIds.every((id) => selectedSet.has(id)),
        [allIds, selectedSet],
    );

    const isIndeterminate = useMemo(
        () => !isAllSelected && allIds.some((id) => selectedSet.has(id)),
        [allIds, isAllSelected, selectedSet],
    );

    // Mutations — all return new Set instances to ensure React re-render
    const select = useCallback((id: T): void => {
        setSelectedSet((prev) => {
            if (prev.has(id)) return prev; // no-op if already selected
            const next = new Set<T>(prev);
            next.add(id);
            return next;
        });
    }, []);

    const deselect = useCallback((id: T): void => {
        setSelectedSet((prev) => {
            if (!prev.has(id)) return prev; // no-op
            const next = new Set<T>(prev);
            next.delete(id);
            return next;
        });
    }, []);

    const toggle = useCallback((id: T): void => {
        setSelectedSet((prev) => {
            const next = new Set<T>(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    // O(n) — acceptable for selectAll
    const selectAll = useCallback((): void => {
        setSelectedSet(new Set<T>(allIds));
    }, [allIds]);

    const clear = useCallback((): void => {
        setSelectedSet(new Set<T>());
    }, []);

    // O(n) over range — inclusive on both ends
    const selectRange = useCallback(
        (startIndex: number, endIndex: number): void => {
            const lo = Math.min(startIndex, endIndex);
            const hi = Math.max(startIndex, endIndex);
            setSelectedSet((prev) => {
                const next = new Set<T>(prev);
                for (let i = lo; i <= hi; i++) {
                    if (i >= 0 && i < allIds.length) {
                        next.add(allIds[i]);
                    }
                }
                return next;
            });
        },
        [allIds],
    );

    return {
        selectedIds: selectedSet as ReadonlySet<T>,
        isSelected,
        isAllSelected,
        isIndeterminate,
        select,
        deselect,
        toggle,
        clear,
        selectAll,
        selectRange,
    };
}
