import { EventLite } from "@/app/(shell)/ClientDataContext";
import { format, parseISO } from "date-fns";
import { Clock, MapPin, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface EventCardProps {
    event: EventLite;
    onClick?: () => void;
    className?: string;
}

export function EventCard({ event, onClick, className }: EventCardProps) {
    return (
        <div
            onClick={onClick}
            className={cn(
                "group relative overflow-hidden rounded-xl border border-white/5 bg-surface/40 p-4 transition-all hover:bg-surface/60 hover:shadow-lg hover:shadow-accent/5 cursor-pointer backdrop-blur-sm",
                className
            )}
        >
            <div className="absolute left-0 top-0 h-full w-1 bg-accent" />

            <div className="mb-2 flex items-start justify-between gap-2">
                <h3 className="font-semibold text-text-primary line-clamp-1 group-hover:text-accent transition-colors">
                    {event.title}
                </h3>
                <span className="shrink-0 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent">
                    Event
                </span>
            </div>

            <div className="flex flex-col gap-1.5 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 text-accent/70" />
                    <span>
                        {format(parseISO(event.startAt), "h:mm a")}
                        {event.endAt && ` - ${format(parseISO(event.endAt), "h:mm a")}`}
                    </span>
                </div>

                {event.location && (
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-accent/70" />
                        <span className="line-clamp-1">{event.location}</span>
                    </div>
                )}

                <div className="flex items-center gap-2 mt-1">
                    <Users className="h-3.5 w-3.5 text-accent/70" />
                    <span>{event.visibility === 'all' ? 'Everyone' : event.visibility === 'team' ? 'Team' : 'Restricted'}</span>
                </div>
            </div>
        </div>
    );
}
