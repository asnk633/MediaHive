import React from 'react';
import { ArrowUpRight } from 'lucide-react';

interface OverviewCardProps {
    title: string;
    value: string | number;
    trend?: string;
    icon: React.ElementType;
    variant?: 'primary' | 'white';
}

export const OverviewCard = ({ title, value, trend, icon: Icon, variant = 'white' }: OverviewCardProps) => {
    const isPrimary = variant === 'primary';

    return (
        <div className={`
      p-5 rounded-[20px] flex flex-col justify-between aspect-[4/3] shadow-sm transition-all hover:-translate-y-1
      ${isPrimary
                ? 'bg-gradient-to-br from-[var(--color-primary-start)] to-[var(--color-primary-end)] text-white shadow-blue-500/25'
                : 'bg-white border border-[var(--color-border)] text-[var(--color-text-primary)]'
            }
    `}>
            <div className={`p-2 rounded-lg w-fit ${isPrimary ? 'bg-white/20 backdrop-blur-sm' : 'bg-blue-50 text-blue-500'}`}>
                <Icon size={20} />
            </div>

            <div>
                <h3 className="text-3xl font-bold mb-1">{value}</h3>
                <p className={`text-sm font-medium ${isPrimary ? 'opacity-90' : 'text-[var(--color-text-secondary)]'}`}>
                    {title}
                </p>
                {trend && (
                    <div className="flex items-center gap-1 text-xs font-medium mt-1 opacity-80">
                        <ArrowUpRight size={12} />
                        {trend}
                    </div>
                )}
            </div>
        </div>
    );
};
