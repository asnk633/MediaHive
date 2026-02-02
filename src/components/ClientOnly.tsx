'use client';

import { useState, useEffect } from 'react';

/**
 * Wrapper that ensures children only render on the client side.
 * Useful for components that should not run during SSG/SSR.
 */
export default function ClientOnly({ children }: { children: React.ReactNode }) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    if (!hasMounted) {
        return null;
    }

    return <>{children}</>;
}
