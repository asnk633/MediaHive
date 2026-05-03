'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CollapsibleSectionHeader } from './CollapsibleSectionHeader';

interface DashboardSectionProps {
    title: string;
    icon?: React.ReactNode;
    isExpanded: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    className?: string;
    sectionId: string;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
    title,
    icon,
    isExpanded,
    onToggle,
    children,
    className,
    sectionId
}) => {
    return (
        <section className={className} id={`section-${sectionId}`}>
            <CollapsibleSectionHeader 
                title={title}
                icon={icon}
                isExpanded={isExpanded}
                onToggle={onToggle}
                ariaLabel={`Toggle ${title} section`}
            />
            
            <AnimatePresence initial={false}>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-visible mt-4"
                    >
                        <div className="space-y-5">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </section>
    );
};
