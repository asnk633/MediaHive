import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InventoryFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    category: string | null;
    onCategoryChange: (value: string | null) => void;
    categories?: string[];
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
    search,
    onSearchChange,
    category,
    onCategoryChange,
    categories = ['Electronics', 'Cables', 'Consumables', 'General']
}) => {
    return (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                    placeholder="Search assets..."
                    className="pl-10 bg-slate-900/50 border-[#ffffff1a] focus:border-blue-500/50 text-white h-10"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onCategoryChange(null)}
                    className={cn(
                        "rounded-full border border-[#ffffff1a] hover:bg-white/5 text-slate-400",
                        category === null && "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-glow"
                    )}
                >
                    All
                </Button>
                {categories.map((cat) => (
                    <Button
                        key={cat}
                        variant="ghost"
                        size="sm"
                        onClick={() => onCategoryChange(cat)}
                        className={cn(
                            "rounded-full border border-[#ffffff1a] hover:bg-white/5 text-slate-400 whitespace-nowrap",
                            category === cat && "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-glow"
                        )}
                    >
                        {cat}
                    </Button>
                ))}
            </div>
        </div>
    );
};
