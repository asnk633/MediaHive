'use client';
import { useEffect, useRef } from 'react';

/**
 * Monitors and logs animation jank (frame drops).
 * Useful for Android Vitals "Slow Rendering" monitoring.
 */
export function useJankMonitor() {
    const frameId = useRef<number | undefined>(undefined);
    const lastFrameTime = useRef<number>(performance.now());

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const monitor = (time: number) => {
            const delta = time - lastFrameTime.current;
            lastFrameTime.current = time;

            // 16.6ms is the threshold for 60fps. 
            // We consider > 32ms as a significant jank (dropped frame).
            if (delta > 32) {
                console.warn(`[JANK] Long frame detected: ${delta.toFixed(2)}ms`);
                if ((window as any).emitBootTelemetry) {
                    (window as any).emitBootTelemetry('slow_render', {
                        frame_duration_ms: delta,
                        timestamp: new Date().toISOString()
                    });
                }
            }

            frameId.current = requestAnimationFrame(monitor);
        };

        frameId.current = requestAnimationFrame(monitor);
        return () => {
            if (frameId.current) cancelAnimationFrame(frameId.current);
        };
    }, []);
}

export function JankMonitor() {
    useJankMonitor();
    return null;
}
