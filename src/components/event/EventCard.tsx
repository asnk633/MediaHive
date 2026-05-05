import Link from "next/link";
import { EventLite } from "@/app/(shell)/ClientDataContext";
import { format, parseISO } from "date-fns";
import { Clock, MapPin, Users, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
    event: EventLite;
    onClick?: () => void;
    className?: string;
    href?: string;
}

export function EventCard({ event, onClick, className, href }: EventCardProps) {
    const start = event.start_at || event.date;
    const isPending = event.status === 'pending';
    const targetHref = href || `/events/${event.id}`;

    return (
        <Link
            href={targetHref}
            onClick={onClick}
            className={cn(
                "event-card-base relative group cursor-pointer overflow-hidden block",
                isPending && "border-amber-500/30 bg-amber-500/5",
                className
            )}
        >
            {/* Status Accent Bar */}
            <div 
                className={cn(
                    "absolute left-0 top-0 h-full w-1 transition-all duration-300 group-hover:w-1.5", 
                    event.is_system_event ? "bg-amber-500" : "bg-blue-500"
                )} 
            />

            <div className="flex flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-white tracking-wide truncate group-hover:text-blue-400 transition-colors">
                        {event.title}
                    </h3>
                    <div className="flex items-center gap-1 shrink-0">
                        {event.is_recurring && (
                            <Repeat className="h-3 w-3 text-blue-400/70" />
                        )}
                        {event.is_system_event && (
                            <span className="shrink-0 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                                System
                            </span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-white/50">
                    <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-blue-400/70" />
                        <span>
                            {event.is_all_day ? (
                                "All Day"
                            ) : (
                                <>
                                    {(() => {
                                        if (!start) return "Time TBD";
                                        try {
                                            const d = typeof start === 'string' ? parseISO(start) : new Date(start);
                                            return format(d, "h:mm a");
                                        } catch (e) { return "Invalid"; }
                                    })()}
                                </>
                            )}
                        </span>
                    </div>

                    {event.location && (
                        <div className="flex items-center gap-1.5 truncate">
                            <MapPin className="h-3 w-3 text-blue-400/70" />
                            <span className="truncate">{event.location}</span>
                        </div>
                    )}
                </div>

                {/* Optional description preview for List/Timeline if needed, but keeping it compact for Month/Week cell compatibility or specialized views */}
            </div>
        </Link>
    );
}
