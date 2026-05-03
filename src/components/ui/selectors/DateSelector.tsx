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
        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 px-1">
          {label}
        </label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-left font-bold text-sm h-11 px-4 rounded-[14px]",
              "bg-white/[0.03] border border-white/10 text-white/90",
              "hover:bg-white/[0.08] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
              "transition-all duration-300 group",
              !date && "text-white/40"
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
          <div className="bg-[#0b1220]/95 backdrop-blur-2xl border border-white/10 rounded-[20px] shadow-2xl overflow-hidden p-1 animate-in fade-in zoom-in-95 duration-200">
            <Calendar
              mode="single"
              selected={date}
              onSelect={onChange}
              disabled={disabledBefore ? { before: disabledBefore } : undefined}
              initialFocus
              className="bg-transparent border-none p-2"
              classNames={{
                day_selected: "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.4)] rounded-xl",
                day_today: "bg-white/5 text-blue-400 font-black rounded-xl",
                day: "h-9 w-9 p-0 font-bold aria-selected:opacity-100 hover:bg-white/10 rounded-xl transition-all",
              }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
