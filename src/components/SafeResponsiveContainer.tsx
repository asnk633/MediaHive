'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ResponsiveContainer, ResponsiveContainerProps } from 'recharts';

/**
 * A wrapper around Recharts ResponsiveContainer that safely handles specific
 * rendering edge cases to prevent "width(-1) height(-1)" console warnings.
 * 
 * It ensures the parent container has measurable dimensions before instantiating
 * the ResponsiveContainer, effectively deferring the chart render until layout is stable.
 */
export const SafeResponsiveContainer = (props: ResponsiveContainerProps) => {
    const [mounted, setMounted] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const [shouldRender, setShouldRender] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!mounted || !containerRef.current) return;

        // Helper to check dimensions
        const checkDimensions = () => {
            if (containerRef.current) {
                const { offsetWidth, offsetHeight } = containerRef.current;
                setShouldRender(offsetWidth > 0 && offsetHeight > 0);
            }
        };

        // Check immediately
        checkDimensions();

        // Also observe resizing
        const observer = new ResizeObserver(() => {
            checkDimensions();
        });

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [mounted]);

    // Always render the wrapper div so it takes up space in the DOM
    return (
        <div ref={containerRef} style={{ width: '100%', height: '100%', minHeight: props.minHeight || '200px', minWidth: 0 }}>
            {shouldRender ? (
                <ResponsiveContainer {...props}>
                    {props.children}
                </ResponsiveContainer>
            ) : null}
        </div>
    );
};
