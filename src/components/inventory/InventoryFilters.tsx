import React from 'react';
import { Search, ArrowUpDown, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SortOption = 'name_asc' | 'name_desc' | 'category' | 'status' | 'date_newest' | 'date_oldest' | 'qty_low_high' | 'qty_high_low';

interface InventoryFiltersProps {
    search: string;
    onSearchChange: (value: string) => void;
    category: string | null;
    onCategoryChange: (value: string | null) => void;
    sortBy: SortOption;
    onSortChange: (value: SortOption) => void;
    categories: string[] | readonly string[];
}

export const InventoryFilters: React.FC<InventoryFiltersProps> = ({
    search,
    onSearchChange,
    category,
    onCategoryChange,
    sortBy,
    onSortChange,
    categories
}) => {
    return (
        <div className="flex flex-col md:flex-row gap-4 mb-6 w-full">
            {/* Search - Full width on mobile, Grow on desktop */}
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <Input
                    placeholder="Search assets by name or serial..."
                    className="pl-10 bg-slate-900/50 border-[#ffffff1a] focus:border-blue-500/50 text-white h-11 rounded-xl w-full transition-all hover:bg-white/[0.02]"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                />
            </div>

            {/* Controls Row - Stacked below search on mobile, Side-by-side on desktop */}
            <div className="flex gap-4 w-full md:w-auto">
                {/* Sort Dropdown */}
                <div className="flex-1 md:w-[180px]">
                    <Select value={sortBy} onValueChange={(v) => onSortChange(v as SortOption)}>
                        <SelectTrigger className="h-11 bg-slate-900/50 border-[#ffffff1a] text-slate-200 rounded-xl focus:ring-blue-500/20 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-2 truncate">
                                <ArrowUpDown className="w-4 h-4 text-slate-500" />
                                <span className="truncate">
                                    {sortBy === 'name_asc' && "Name (A-Z)"}
                                    {sortBy === 'name_desc' && "Name (Z-A)"}
                                    {sortBy === 'category' && "Category"}
                                    {sortBy === 'status' && "Status"}
                                    {sortBy === 'date_newest' && "Newest First"}
                                    {sortBy === 'date_oldest' && "Oldest First"}
                                    {sortBy === 'qty_low_high' && "Qty (Low-High)"}
                                    {sortBy === 'qty_high_low' && "Qty (High-Low)"}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-[#ffffff1a] rounded-xl">
                            <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                            <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="date_newest">Newest First</SelectItem>
                            <SelectItem value="date_oldest">Oldest First</SelectItem>
                            <SelectItem value="qty_low_high">Qty (Low-High)</SelectItem>
                            <SelectItem value="qty_high_low">Qty (High-Low)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Category Dropdown */}
                <div className="flex-1 md:w-[200px]">
                    <Select
                        value={category || "all"}
                        onValueChange={(v) => onCategoryChange(v === "all" ? null : v)}
                    >
                        <SelectTrigger className="h-11 bg-slate-900/50 border-[#ffffff1a] text-slate-200 rounded-xl focus:ring-blue-500/20 hover:bg-white/[0.02] transition-colors">
                            <div className="flex items-center gap-2 truncate">
                                <Filter className="w-4 h-4 text-slate-500" />
                                <span className="truncate">
                                    {category || "All Categories"}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent className="bg-slate-900 border-[#ffffff1a] rounded-xl max-h-[300px]">
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                    {cat}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </div>
    );
};
