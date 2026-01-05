import React from 'react';
import Image from 'next/image';

interface MediaHiveLoaderProps {
    className?: string;
    size?: number; // Base size multiplier, default 1
}

export const MediaHiveLoader: React.FC<MediaHiveLoaderProps> = ({ className = '', size = 1 }) => {
    // Determine font-size to scale em units
    // Base size 16px -> 2.5em = 40px
    // If user wants specific pixel size?
    // Let's rely on standard em scaling.
    const style = { fontSize: `${16 * size}px` } as React.CSSProperties;

    return (
        <div className={`flex flex-col items-center justify-center ${className}`} style={style}>
            {/* Container for Loader + Logo */}
            <div className="relative flex items-center justify-center" style={{ width: '5em', height: '5em' }}>

                {/* The CSS Animated Loader (surrounding/background) */}
                {/* The user CSS rotates the loader 165deg. Centering it might be tricky visually if we want it perfect. */}
                <div className="mediahive-loader absolute" style={{ zIndex: 10 }}></div>

                {/* The Logo at Center */}
                <div className="relative z-20 animate-pulse" style={{ width: '1.5em', height: '1.5em' }}>
                    <Image
                        src="/logo-small.png"
                        alt="MediaHive Logo"
                        fill
                        className="object-contain"
                        sizes="10vw"
                        priority
                    />
                </div>
            </div>

            {/* Optional text below? User didn't ask but usually nice */}
        </div>
    );
};
