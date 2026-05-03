"use client";

import * as React from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface SearchSelectOption {
  id: string;
  label: string;
}

interface SearchSelectProps {
  options: SearchSelectOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  label?: string;
  className?: string;
}

export function SearchSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  label,
  className,
}: SearchSelectProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOption = options.find((opt) => opt.id === value);

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-1">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-bold text-sm h-11 px-4 rounded-[14px]",
              "bg-white/[0.03] border border-white/10 text-white/90",
              "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
              "transition-all duration-300 group",
              !value && "text-white/40"
            )}
          >
            <div className="flex items-center gap-3 truncate">
              <Search className="h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span className="truncate">
                {selectedOption ? selectedOption.label : placeholder}
              </span>
            </div>
            <ChevronDown className={cn(
              "ml-2 h-4 w-4 opacity-40 transition-transform duration-300",
              open && "rotate-180 opacity-100 text-blue-400"
            )} />
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="p-0 bg-transparent border-none shadow-none" 
          align="start"
          sideOffset={8}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <div className="bg-[#0b1220]/95 backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <Command className="bg-transparent">
              <CommandInput 
                placeholder={searchPlaceholder} 
                className="h-12 border-b border-white/5 bg-transparent text-white font-medium placeholder:text-white/20 px-4"
              />
              <CommandList className="max-h-[300px] p-2">
                <CommandEmpty className="py-6 text-center text-white/20 text-xs font-black uppercase tracking-widest">
                  No matches found.
                </CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={option.label}
                      onSelect={() => {
                        onChange(option.id);
                        setOpen(false);
                      }}
                      className={cn(
                        "px-3 py-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer",
                        "text-sm font-bold mb-1",
                        value === option.id
                          ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                          : "text-white/60 hover:bg-white/5 hover:text-white aria-selected:bg-white/5 aria-selected:text-white"
                      )}
                    >
                      <span>{option.label}</span>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4 transition-opacity",
                          value === option.id ? "opacity-100" : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
