
import { useState, useEffect } from 'react';

/**
 * Hook to ensure component is mounted on the client side.
 * Useful for preventing hydration mismatches with libraries like Recharts
 * that rely on window/DOM properties.
 */
export function useClientReady() {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    return isReady;
}
