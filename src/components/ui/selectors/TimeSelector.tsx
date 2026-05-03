"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface TimeSelectorProps {
  value: string; // "HH:MM" 24h format
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function TimeSelector({
  value,
  onChange,
  label,
  className,
}: TimeSelectorProps) {
  // Parse initial value or default to 09:00
  const [hour, minute] = (value || "09:00").split(":").map(Number);

  // Convert to 12h format for UI state
  const [selectedHour, setSelectedHour] = React.useState(hour % 12 || 12);
  const [selectedMinute, setSelectedMinute] = React.useState(minute);
  const [period, setPeriod] = React.useState<"AM" | "PM">(hour >= 12 ? "PM" : "AM");

  // Update parent when any part changes
  React.useEffect(() => {
    let newHour = selectedHour;
    if (period === "PM" && selectedHour !== 12) newHour += 12;
    if (period === "AM" && selectedHour === 12) newHour = 0;

    const timeString = `${newHour.toString().padStart(2, "0")}:${selectedMinute
      .toString()
      .padStart(2, "0")}`;
    if (timeString !== value) {
      onChange(timeString);
    }
  }, [selectedHour, selectedMinute, period, onChange, value]);

  const hours = Array.from({ length: 12 }, (_, i) => i + 1);
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  const displayTime = `${selectedHour}:${selectedMinute.toString().padStart(2, "0")} ${period}`;

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
              "transition-all duration-300 group"
            )}
          >
            <Clock className="mr-3 h-4 w-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span className="truncate">{displayTime}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[280px] p-0 bg-transparent border-none shadow-none"
          align="start"
          sideOffset={8}
        >
          <div className="bg-[#0b1220]/95 backdrop-blur-2xl border border-white/10 rounded-[24px] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex h-[240px]">
              {/* Hours */}
              <div className="flex-1 flex flex-col pt-3">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center mb-2">Hour</div>
                <ScrollArea className="flex-1 px-2 pb-3">
                  <div className="space-y-1">
                    {hours.map((h) => (
                      <button
                        key={h}
                        onClick={() => setSelectedHour(h)}
                        className={cn(
                          "w-full h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all",
                          selectedHour === h
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Minutes */}
              <div className="flex-1 flex flex-col pt-3 border-l border-white/5">
                <div className="text-[9px] font-black text-white/20 uppercase tracking-widest text-center mb-2">Min</div>
                <ScrollArea className="flex-1 px-2 pb-3">
                  <div className="space-y-1">
                    {minutes.map((m) => (
                      <button
                        key={m}
                        onClick={() => setSelectedMinute(m)}
                        className={cn(
                          "w-full h-10 flex items-center justify-center rounded-xl font-bold text-sm transition-all",
                          selectedMinute === m
                            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                            : "text-white/40 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        {m.toString().padStart(2, "0")}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* AM/PM */}
              <div className="w-[70px] flex flex-col p-2 space-y-2 justify-center bg-white/[0.02] border-l border-white/5">
                {["AM", "PM"].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p as "AM" | "PM")}
                    className={cn(
                      "flex-1 rounded-xl font-black text-xs transition-all",
                      period === p
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                        : "text-white/20 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
