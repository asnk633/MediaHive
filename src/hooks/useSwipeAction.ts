import { useState, useRef, useCallback } from 'react';

interface UseSwipeActionProps {
    onSwipeRight?: () => void;
    onSwipeLeft?: () => void;
    threshold?: number; // px to trigger
}

export function useSwipeAction({ onSwipeRight, onSwipeLeft, threshold = 100 }: UseSwipeActionProps) {
    const [offset, setOffset] = useState(0);
    const [isSwiping, setIsSwiping] = useState(false);
    const startX = useRef<number | null>(null);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        setIsSwiping(true);
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        if (startX.current === null) return;
        const currentX = e.touches[0].clientX;
        const diff = currentX - startX.current;

        // Limit swipe range for visual feel
        if (diff > 0 && !onSwipeRight) return;
        if (diff < 0 && !onSwipeLeft) return;

        setOffset(diff);
    }, [onSwipeRight, onSwipeLeft]);

    const onTouchEnd = useCallback(() => {
        if (offset > threshold && onSwipeRight) {
            onSwipeRight();
        } else if (offset < -threshold && onSwipeLeft) {
            onSwipeLeft();
        }

        // Reset
        setOffset(0);
        setIsSwiping(false);
        startX.current = null;
    }, [offset, threshold, onSwipeRight, onSwipeLeft]);

    return {
        handlers: {
            onTouchStart,
            onTouchMove,
            onTouchEnd
        },
        style: {
            transform: `translateX(${offset}px)`,
            transition: isSwiping ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
        },
        offset,
        isSwiping
    };
}
