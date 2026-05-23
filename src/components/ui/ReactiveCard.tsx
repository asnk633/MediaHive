'use client';

import React, { useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ReactiveCardProps {
    children: React.ReactNode;
    className?: string;
    glowColor?: string;
    onClick?: () => void;
}

export const ReactiveCard: React.FC<ReactiveCardProps> = ({ 
    children, 
    className,
    glowColor = 'rgba(255, 184, 0, 0.15)',
    onClick
}) => {
    const cardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (window.innerWidth < 768) return;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
        };

        card.addEventListener('mousemove', handleMouseMove);
        return () => card.removeEventListener('mousemove', handleMouseMove);
    }, []);

    return (
        <div 
            ref={cardRef}
            onClick={onClick}
            className={cn(
                "relative group overflow-hidden transition-all duration-300",
                className
            )}
        >
            {/* Edge Glow Layer */}
            <div 
                className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), ${glowColor}, transparent 80%)`
                }}
            />
            
            {/* Content Layer (Ensure it's above the glow if needed, or the glow is above background but below interactivity) */}
            <div className="relative z-20">
                {children}
            </div>
        </div>
    );
};
