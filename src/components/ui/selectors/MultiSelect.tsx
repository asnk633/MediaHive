"use client";

import * as React from "react";
import { X, ChevronDown, Check, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface MultiSelectOption {
  id: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  searchable?: boolean;
  tabIndex?: number;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  label,
  className,
  searchable = true,
  tabIndex,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");

  const filteredOptions = React.useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [options, searchQuery]);

  // Reset search when opening
  React.useEffect(() => {
    if (open) setSearchQuery("");
  }, [open]);

  const toggleOption = (id: string) => {
    const newSelected = selected.includes(id)
      ? selected.filter((s) => s !== id)
      : [...selected, id];
    onChange(newSelected);
  };

  const removeOption = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 px-1">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div
            tabIndex={tabIndex}
            className={cn(
              "flex min-h-11 w-full flex-wrap items-center gap-2 rounded-[14px] px-3 py-2 cursor-pointer transition-all duration-300",
              "bg-foreground/[0.03] border border-foreground/10 text-foreground/90 hover:bg-foreground/[0.08] hover:border-foreground/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
              open && "border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
            )}
          >
            {selected.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selected.map((id) => {
                  const option = options.find((o) => o.id === id);
                  return (
                    <Badge
                      key={id}
                      variant="info"
                      className="bg-blue-500/10 text-blue-400 border-blue-500/20 pr-1 py-1 rounded-lg lowercase tracking-tight normal-case font-bold"
                    >
                      {option?.label}
                      <button
                        onClick={(e) => removeOption(id, e)}
                        className="ml-1 p-0.5 rounded-full hover:bg-blue-400/20 transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <span className="text-foreground/80 text-sm font-bold pl-1">{placeholder}</span>
            )}
            <ChevronDown className={cn(
              "ml-auto h-4 w-4 opacity-40 transition-transform duration-300",
              open && "rotate-180 opacity-100 text-blue-400"
            )} />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 bg-transparent border-none shadow-none z-[200]"
          align="start"
          sideOffset={8}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <div className="bg-[var(--glass-liquid-bg)] backdrop-blur-2xl border border-border rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {searchable && (
              <div className="p-2 border-b border-foreground/5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/70" />
                  <input
                    className="w-full bg-foreground/5 border-none focus:ring-0 text-sm h-9 pl-9 pr-4 rounded-lg text-foreground/90 placeholder:text-foreground/80 font-medium"
                    placeholder="Search options..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            )}
            <ScrollArea className="max-h-[300px]">
              <div className="p-2 space-y-1">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((option) => (
                    <button
                      key={option.id}
                      onClick={() => toggleOption(option.id)}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all",
                        "text-sm font-bold text-left",
                        selected.includes(option.id)
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/20"
                          : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground border border-transparent"
                      )}
                    >
                      <span>{option.label}</span>
                      {selected.includes(option.id) && <Check className="h-4 w-4" />}
                    </button>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs font-bold text-foreground/80 uppercase tracking-widest">
                    No results found
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
