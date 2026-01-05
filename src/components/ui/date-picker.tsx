"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { TimePicker } from "@/components/ui/time-picker"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
    date?: Date
    setDate: (date: Date | undefined) => void
    placeholder?: string
    className?: string
    showTime?: boolean
}

export function DatePicker({ date, setDate, placeholder = "Pick a date", className, showTime = false }: DatePickerProps) {
    const handleTimeChange = (timeString: string) => {
        // timeString is "HH:MM" (24h)
        if (!date) return;
        const [hours, minutes] = timeString.split(':').map(Number);
        const newDate = new Date(date);
        newDate.setHours(hours);
        newDate.setMinutes(minutes);
        setDate(newDate);
    };

    const formattedDate = date ? (showTime ? format(date, "MMM d, yyyy h:mm a") : format(date, "MMM d, yyyy")) : null;

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal bg-background/50 border-input hover:bg-white/5 hover:text-white transition-colors overflow-hidden",
                        !date && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                    <span className="truncate">
                        {formattedDate ? formattedDate : placeholder}
                    </span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-transparent border-none shadow-none" align="start">
                <div className="flex flex-col sm:flex-row gap-2 bg-slate-900/90 backdrop-blur-xl border border-white/10 p-2 rounded-2xl shadow-2xl">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={(newDate) => {
                            if (newDate) {
                                // Preserve time if exists, else default to current time or 09:00
                                const current = date || new Date();
                                newDate.setHours(current.getHours());
                                newDate.setMinutes(current.getMinutes());
                                setDate(newDate);
                            } else {
                                setDate(undefined);
                            }
                        }}
                        initialFocus
                        className="rounded-xl border-none shadow-none bg-transparent"
                    />
                    {showTime && date && (
                        <div className="p-2 border-l border-white/10 flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-white/50 text-xs font-bold uppercase tracking-widest pl-2">
                                <Clock size={12} />
                                Time
                            </div>
                            <TimePicker
                                value={format(date, "HH:mm")}
                                onChange={handleTimeChange}
                            />
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
