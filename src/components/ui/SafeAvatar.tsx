import React, { useState } from 'react';
import { User, ImageOff } from 'lucide-react';
import { getInitials } from '@/lib/utils';

interface SafeAvatarProps {
    src?: string | null;
    alt: string;
    name?: string; // Name for generating initials
    size?: number | 'sm' | 'md' | 'lg' | 'xl';
    className?: string; // Additional classes for container
    fallbackText?: string; // Force specific fallback text
    referrerPolicy?: React.HTMLAttributeReferrerPolicy;
    priority?: boolean;
}

const sizeMap = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
};

export const SafeAvatar: React.FC<SafeAvatarProps> = ({
    src,
    alt,
    name,
    size = 'md',
    className = '',
    fallbackText,
    referrerPolicy = 'no-referrer',
    priority = false
}) => {
    const [error, setError] = useState(false);
    const [loading, setLoading] = useState(true);

    // Normalize size
    const pxSize = typeof size === 'number' ? size : sizeMap[size] || 40;

    // Tailwind map for consistent sizing classes if needed, or inline styles
    const sizeClasses = typeof size === 'string' ? {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
        xl: 'w-24 h-24'
    }[size] : `w-[${pxSize}px] h-[${pxSize}px]`; // Approximate, better to use inline style for custom number

    const containerStyle = typeof size === 'number' ? { width: pxSize, height: pxSize } : {};

    // Calculate display initials
    const displayInitials = fallbackText || getInitials(name || alt);

    const handleImageLoad = () => {
        setLoading(false);
        setError(false);
    };

    const handleError = () => {
        setLoading(false);
        setError(true);
        // Suppress console error in production if desired, but React handles error boundary internally
    };

    // Determine what to render
    const showFallback = error || !src;

    return (
        <div
            className={`relative rounded-full overflow-hidden bg-foreground/10 flex items-center justify-center shrink-0 border border-[#ffffff1a] ${sizeClasses} ${className}`}
            style={!className.includes('w-') ? containerStyle : undefined}
            title={name || alt}
        >
            {!showFallback && (
                <img
                    src={src}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${loading ? 'opacity-0' : 'opacity-100'}`}
                    onError={handleError}
                    onLoad={handleImageLoad}
                    referrerPolicy={referrerPolicy}
                    loading={priority ? "eager" : "lazy"}
                />
            )}

            {/* Fallback View (Initials or Icon) */}
            {showFallback && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-foreground/70">
                    {displayInitials !== '??' ? (
                        <span className="font-bold text-foreground/80 uppercase" style={{ fontSize: pxSize * 0.4 }}>
                            {displayInitials}
                        </span>
                    ) : (
                        <User size={pxSize * 0.5} />
                    )}
                </div>
            )}

            {/* Loading Skeleton (only visible if loading and not errored yet) */}
            {loading && !error && src && (
                <div className="absolute inset-0 bg-foreground/5 animate-pulse" />
            )}
        </div>
    );
};
