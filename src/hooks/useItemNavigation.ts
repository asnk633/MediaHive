import { useState, useEffect, useCallback } from 'react';

interface UseItemNavigationProps<T> {
    items: T[];
    getItemId: (item: T) => string;
    onSelect?: (item: T) => void;
    onComplete?: (item: T) => void;
    onSnooze?: (item: T) => void;
}

export function useItemNavigation<T>({ items, getItemId, onSelect, onComplete, onSnooze }: UseItemNavigationProps<T>) {
    const [activeId, setActiveId] = useState<string | null>(null);

    // Scroll active item into view when it changes
    useEffect(() => {
        if (!activeId) return;
        const el = document.getElementById(`nav-item-${activeId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [activeId]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Safety: Ignore inputs
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable) return;

        // Navigation
        if (e.key === 'j' || e.key === 'J') {
            setActiveId(prev => {
                const idx = items.findIndex(item => getItemId(item) === prev);
                if (idx === -1 || idx === items.length - 1) return getItemId(items[0]); // Wrap or Start
                return getItemId(items[idx + 1]);
            });
        }
        else if (e.key === 'k' || e.key === 'K') {
            setActiveId(prev => {
                const idx = items.findIndex(item => getItemId(item) === prev);
                if (idx <= 0) return getItemId(items[items.length - 1]); // Wrap or End
                return getItemId(items[idx - 1]);
            });
        }
        // Actions
        else if (e.key === 'Enter') {
            if (activeId) {
                const item = items.find(i => getItemId(i) === activeId);
                if (item) {
                    e.preventDefault();
                    onSelect?.(item);
                }
            }
        }
        else if (e.key === 'e' || e.key === 'E') {
            if (activeId) {
                const item = items.find(i => getItemId(i) === activeId);
                if (item) {
                    e.preventDefault();
                    onComplete?.(item);
                }
            }
        }
        else if (e.key === 's' || e.key === 'S') {
            if (activeId) {
                const item = items.find(i => getItemId(i) === activeId);
                if (item) {
                    e.preventDefault();
                    onSnooze?.(item);
                }
            }
        }
    }, [items, activeId, getItemId, onSelect, onComplete, onSnooze]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return { activeId, setActiveId };
}
