'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreateEventForm } from '@/components/library/organisms/CreateEventForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { EventService } from '@/features/events/services/eventService';
import { nativeNavigate } from '@/lib/utils';
import { toast } from 'sonner';

export default function EditEventClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const eventId = searchParams.get('id');
    const [event, setEvent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchEvent = async () => {
            if (!eventId) {
                setError("No event ID provided");
                setLoading(false);
                return;
            }

            try {
                const data = await EventService.getEventById(eventId);
                if (!data) {
                    setError("Event not found");
                } else {
                    setEvent(data);
                }
            } catch (err) {
                console.error("Error fetching event for edit:", err);
                setError("Failed to load event details");
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [eventId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-night-sky text-white flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <div className="text-white/30 font-mono text-xs uppercase tracking-widest">Loading Event Details...</div>
            </div>
        );
    }

    if (error || !event) {
        return (
            <div className="min-h-screen bg-night-sky text-white flex flex-col items-center justify-center gap-6 p-4">
                <div className="text-center space-y-2">
                    <h2 className="text-xl font-bold text-red-400">Error</h2>
                    <p className="text-white/60">{error || "Something went wrong"}</p>
                </div>
                <Button onClick={() => router.back()} variant="outline" className="border-white/10 hover:bg-white/5">
                    Go Back
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-night-sky text-white p-4 lg:p-8 flex justify-center">
            <div className="w-full max-w-4xl space-y-6">

                {/* Header with Back Button */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="rounded-full hover:bg-white/10"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Edit Event</h1>
                        <p className="text-white/60 text-sm">Update the details for "{event.title}"</p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-[#10111a] border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl backdrop-blur-sm">
                    <CreateEventForm 
                        initialEvent={event}
                        onSuccess={() => {
                            toast.success("Event updated successfully");
                            nativeNavigate(`/events/${event.id}`, router, 'EditEvent (Success)');
                        }} 
                        onCancel={() => router.back()}
                    />
                </div>

            </div>
        </div>
    );
}
