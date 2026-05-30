import React from 'react';
import { Search, ArrowUpDown, Filter, List, Grid } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { DropdownSelector } from '@/components/ui/selectors/DropdownSelector';
import { cn } from '@/lib/utils';

export type SortOption = 
    | 'name_asc' 
    | 'name_desc' 
    | 'category' 
    | 'date_newest' 
    | 'date_oldest' 
    | 'qty_low_high' 
    | 'qty_high_low'
    | 'status_available'
    | 'status_in_use'
    | 'status_maintenance'
    | 'status_retired'
    | 'condition_good'
    | 'condition_fair'
    | 'condition_poor'
    | 'condition_damaged';

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
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground/60" size={18} />
                <Input
                    placeholder="Search assets by name or serial..."
                    className="pl-10 bg-slate-900/50 border-[#ffffff1a] focus:border-blue-500/50 text-foreground h-11 rounded-xl w-full transition-all hover:bg-foreground/[0.02]"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Controls Row */}
            <div className="flex flex-wrap md:flex-nowrap gap-3 items-center">
                {/* Sort Dropdown */}
                <div className="flex-1 min-w-[200px] md:w-[220px]">
                    <DropdownSelector 
                        value={sortBy}
                        onChange={(v) => onSortChange(v as SortOption)}
                        options={[
                            { id: 'name_asc', label: 'Name (A-Z)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'name_desc', label: 'Name (Z-A)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'category', label: 'Category', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'date_newest', label: 'Newest First', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'date_oldest', label: 'Oldest First', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'qty_low_high', label: 'Qty (Low-High)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'qty_high_low', label: 'Qty (High-Low)', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'status_available', label: 'Status: Available', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'status_in_use', label: 'Status: In Use', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'status_maintenance', label: 'Status: Maintenance', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'status_retired', label: 'Status: Retired', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'condition_good', label: 'Condition: Good', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'condition_fair', label: 'Condition: Fair', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'condition_poor', label: 'Condition: Poor', icon: <ArrowUpDown className="w-4 h-4" /> },
                            { id: 'condition_damaged', label: 'Condition: Damaged', icon: <ArrowUpDown className="w-4 h-4" /> },
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
                    <div className="flex items-center gap-1 p-1 bg-foreground/5 border border-foreground/10 rounded-xl shrink-0">
                        <button
                            onClick={() => onViewModeChange('list')}
                            className={cn(
                                "p-2 rounded-lg transition-all",
                                viewMode === 'list' 
                                ? "bg-foreground/10 text-blue-400 shadow-sm" 
                                : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
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
                                ? "bg-foreground/10 text-blue-400 shadow-sm" 
                                : "text-foreground/50 hover:text-foreground hover:bg-foreground/5"
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
