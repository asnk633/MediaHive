import { useEffect, useState } from 'react';

/**
 * Hook to get safe area insets via CSS variables or calculation.
 * Useful for inline styles where CSS env() might not be sufficient or JS-driven layouts.
 */
export function useSafeBottomOffset(fallback = 0) {
    const [offset, setOffset] = useState(fallback);

    useEffect(() => {
        // Check if CSS env is supported and retrievable
        const div = document.createElement('div');
        div.style.paddingBottom = 'env(safe-area-inset-bottom)';
        document.body.appendChild(div);
        const computed = getComputedStyle(div).paddingBottom;
        document.body.removeChild(div);

        const val = parseInt(computed, 10);
        if (!isNaN(val) && val > 0) {
            setOffset(val);
        }
    }, []);

    return offset;
}

export function useSafeTopOffset(fallback = 0) {
    const [offset, setOffset] = useState(fallback);

    useEffect(() => {
        const div = document.createElement('div');
        div.style.paddingTop = 'env(safe-area-inset-top)';
        document.body.appendChild(div);
        const computed = getComputedStyle(div).paddingTop;
        document.body.removeChild(div);

        const val = parseInt(computed, 10);
        if (!isNaN(val) && val > 0) {
            setOffset(val);
        }
    }, []);

    return offset;
}
