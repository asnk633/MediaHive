import React from 'react';
import { Search, ArrowUpDown, Filter, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { cn } from '@/lib/utils';

export type SortOption = 'name_asc' | 'name_desc' | 'category' | 'status' | 'date_newest' | 'date_oldest' | 'qty_low_high' | 'qty_high_low';

interface InventoryFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    category: string | null;
    onCategoryChange: (value: string | null) => void;
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
    categories: string[] | readonly string[];
    viewMode?: 'list' | 'grid';
    onViewModeChange?: (mode: 'list' | 'grid') => void;
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
    search,
    onSearchChange,
    category,
    onCategoryChange,
    sortBy,
    onSortChange,
    categories,
    viewMode = 'list',
    onViewModeChange
}) => {
    return (
        <div className="flex flex-col xl:flex-row gap-4 mb-6 w-full items-stretch xl:items-center">
            {/* Search */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <Input
                    placeholder="Search assets by name or serial..."
                    className="pl-10 bg-slate-900/50 border-[#ffffff1a] focus:border-blue-500/50 text-white h-11 rounded-xl w-full transition-all hover:bg-white/[0.02]"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                {/* Sort Dropdown */}
                <div className="flex-1 min-w-[160px] md:w-[180px]">
                    <DropdownSelector 
                        value={sortBy}
                        onChange={(v) => onSortChange(v as SortOption)}
                        options={[
                            { id: 'name_asc', label: 'Name (A-Z)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'name_desc', label: 'Name (Z-A)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'category', label: 'Category', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'status', label: 'Status', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'date_newest', label: 'Newest First', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'date_oldest', label: 'Oldest First', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'qty_low_high', label: 'Qty (Low-High)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'qty_high_low', label: 'Qty (High-Low)', icon: <ArrowUpDown className="w-4 h-4" /> },
                        ]}
                    />
                </div>

                {/* Category Dropdown */}
                <div className="flex-1 min-w-[160px] md:w-[200px]">
                    <DropdownSelector 
                        value={category || "all"}
                        onChange={(v) => onCategoryChange(v === "all" ? null : v)}
                        options={[
                            { id: 'all', label: 'All Categories', icon: <Filter className="w-4 h-4" /> },
                            ...categories.map(cat => ({ id: cat, label: cat, icon: <Filter className="w-4 h-4" /> }))
                        ]}
                    />
                </div>

                {/* View Mode Toggle */}
                {onViewModeChange && (
                    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl shrink-0">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'list' 
                                ? "bg-white/10 text-blue-400 shadow-sm" 
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                        <button
                            onClick={() => onViewModeChange('grid')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'grid' 
                                ? "bg-white/10 text-blue-400 shadow-sm" 
                                : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                            title="Grid View"
                        >
                            <Grid size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
