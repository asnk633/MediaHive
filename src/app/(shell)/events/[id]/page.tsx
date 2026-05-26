"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { EventDetailsModal } from '@/components/events/EventDetailsModal';
import { EventService } from '@/features/events/services/eventService';
import { Event } from '@/features/events/types/event';
import { PageLayout } from '@/components/ui/layout/PageLayout';
import { toast } from 'sonner';

export default function EventStandalonePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;
    const [event, setEvent] = useState<Event | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        const fetchEvent = async () => {
            try {
                const data = await EventService.getEventById(id);
                if (data) {
                    setEvent(data);
                } else {
                    toast.error("Event not found");
                    router.push('/events');
                }
            } catch (err) {
                console.error("Failed to fetch event for standalone page", err);
                toast.error("An error occurred while loading the event");
                router.push('/events');
            } finally {
                setLoading(false);
            }
        };

        fetchEvent();
    }, [id, router]);

    if (loading) {
        return (
            <PageLayout mode="plain">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
            </PageLayout>
        );
    }

    if (!event) return null;

    return (
        <PageLayout mode="plain">
            <EventDetailsModal 
                event={event}
                isOpen={true}
                onClose={() => router.push('/events')}
                onEdit={() => router.push(`/events/edit?id=${event.id}`)}
            />
        </PageLayout>
    );
}
