"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DropdownOption {
  id: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface DropdownSelectorProps {
  options: DropdownOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
}

export function DropdownSelector({
  options,
  value,
  onChange,
  placeholder = "Select option",
  label,
  className,
  triggerClassName,
  disabled = false,
}: DropdownSelectorProps) {
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
            disabled={disabled}
            className={cn(
              "w-full justify-between text-left font-bold text-sm h-11 px-4 rounded-[14px]",
              "bg-white/[0.03] border border-white/10 text-white/90",
              "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
              "transition-all duration-300 group",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-3 truncate">
              {selectedOption?.icon && (
                <span className="text-blue-400 group-hover:scale-110 transition-transform">
                  {selectedOption.icon}
                </span>
              )}
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
            <ScrollArea className="max-h-[300px]">
              <div className="p-2 space-y-1">
                {options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl flex items-center justify-between transition-all",
                      "text-sm font-bold",
                      value === option.id
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-white/40 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {option.icon && (
                         <span className={cn(
                           "h-4 w-4",
                           value === option.id ? "text-white" : "text-white/50"
                         )}>
                            {option.icon}
                         </span>
                      )}
                      <span>{option.label}</span>
                    </div>
                    {value === option.id && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
