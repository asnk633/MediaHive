"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateSelectorProps {
  date?: Date;
  onChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  disabledBefore?: Date;
}

export function DateSelector({
  date,
  onChange,
  placeholder = "Select date",
  className,
  label,
  disabledBefore,
}: DateSelectorProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <label className="text-[10px] font-black uppercase tracking-widest text-foreground/70 px-1">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left font-bold text-sm h-11 px-4 rounded-[14px]",
              "bg-foreground/[0.03] border border-foreground/10 text-foreground/90",
              "hover:bg-foreground/[0.08] hover:border-foreground/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
              "transition-all duration-300 group",
              !date && "text-foreground/80"
            )}
          >
            <CalendarIcon className="mr-3 h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">
              {date ? format(date, "PPP") : placeholder}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-auto p-0 bg-transparent border-none shadow-none" 
          align="start"
          sideOffset={8}
        >
          <div className="bg-[var(--glass-liquid-bg)] backdrop-blur-2xl border border-border rounded-[20px] shadow-2xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-200">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onChange}
              disabled={disabledBefore ? { before: disabledBefore } : undefined}
              initialFocus
              className="bg-transparent border-none p-2"
              classNames={{
                day_selected: "bg-blue-600 text-foreground hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] rounded-xl",
                day_today: "bg-foreground/5 text-blue-400 font-black rounded-xl",
                day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-foreground/10 rounded-xl transition-all",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
