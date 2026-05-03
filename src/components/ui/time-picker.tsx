"use client";

import * as React from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimePickerProps {
    value: string; // "HH:MM" 24h format
    onChange: (value: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
    // Parse initial value or default to 09:00
    const [hour, minute] = (value || "09:00").split(':').map(Number);

    // Convert to 12h format for UI state
    const [selectedHour, setSelectedHour] = React.useState(hour % 12 || 12);
    const [selectedMinute, setSelectedMinute] = React.useState(minute);
    const [period, setPeriod] = React.useState<'AM' | 'PM'>(hour >= 12 ? 'PM' : 'AM');

    // Update parent when any part changes
    React.useEffect(() => {
        let newHour = selectedHour;
        if (period === 'PM' && selectedHour !== 12) newHour += 12;
        if (period === 'AM' && selectedHour === 12) newHour = 0;

        const timeString = `${newHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
        onChange(timeString);
    }, [selectedHour, selectedMinute, period]);

    const hours = Array.from({ length: 12 }, (_, i) => i + 1);
    const minutes = [0, 15, 30, 45]; // 15 min intervals

    return (
        <div className="flex bg-[#141e30] border border-[#ffffff1a] rounded-xl overflow-hidden shadow-2xl w-[320px]">
            {/* Hours Column */}
            <div className="flex-1 border-r border-[#ffffff0d]">
                <div className="h-10 flex items-center justify-center bg-white/5 text-xs font-bold text-white/50 uppercase tracking-widest border-b border-[#ffffff0d]">
                    Hour
                </div>
                <ScrollArea className="h-[200px]">
                    <div className="flex flex-col p-2 gap-1">
                        {hours.map((h) => (
                            <Button
                                key={h}
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedHour(h)}
                                className={cn(
                                    "w-full justify-center font-bold text-lg h-10 rounded-lg transition-all",
                                    selectedHour === h
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-white/40 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {h}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* Minutes Column */}
            <div className="flex-1 border-r border-[#ffffff0d]">
                <div className="h-10 flex items-center justify-center bg-white/5 text-xs font-bold text-white/50 uppercase tracking-widest border-b border-[#ffffff0d]">
                    Min
                </div>
                <ScrollArea className="h-[200px]">
                    <div className="flex flex-col p-2 gap-1">
                        {minutes.map((m) => (
                            <Button
                                key={m}
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedMinute(m)}
                                className={cn(
                                    "w-full justify-center font-bold text-lg h-10 rounded-lg transition-all",
                                    selectedMinute === m
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                                        : "text-white/40 hover:text-white hover:bg-white/10"
                                )}
                            >
                                {m.toString().padStart(2, '0')}
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            {/* AM/PM Column */}
            <div className="flex-1 bg-white/[0.02]">
                <div className="h-10 flex items-center justify-center bg-white/5 text-xs font-bold text-white/50 uppercase tracking-widest border-b border-white/5">
                    Period
                </div>
                <div className="flex flex-col p-2 gap-2 h-[200px] justify-center">
                    {['AM', 'PM'].map((p) => (
                        <Button
                            key={p}
                            variant="ghost"
                            size="sm"
                            onClick={() => setPeriod(p as 'AM' | 'PM')}
                            className={cn(
                                "w-full justify-center font-bold text-lg h-16 rounded-xl transition-all",
                                period === p
                                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 ring-1 ring-white/20"
                                    : "text-white/50 hover:text-white hover:bg-white/10"
                            )}
                        >
                            {p}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
