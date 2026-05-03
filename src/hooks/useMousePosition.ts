'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export function useMousePosition() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!containerRef.current) return;

        // Disable on mobile/touch check
        if (window.innerWidth < 768) return;

        const rect = containerRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setMousePosition({ x, y });

        // Directly update CSS variables for performance
        containerRef.current.style.setProperty('--mouse-x', `${x}px`);
        containerRef.current.style.setProperty('--mouse-y', `${y}px`);
    }, []);

    // We don't necessarily need the state if we're using CSS variables directly for performance,
    // but keeping handleMouseMove and ref logic here is clean.
    
    useEffect(() => {
        const node = containerRef.current;
        if (node) {
            node.addEventListener('mousemove', handleMouseMove);
            return () => node.removeEventListener('mousemove', handleMouseMove);
        }
    }, [handleMouseMove]);

    return { containerRef, mousePosition };
}
