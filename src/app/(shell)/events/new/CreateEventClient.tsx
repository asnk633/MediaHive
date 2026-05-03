'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CreateEventForm } from '@/components/library/organisms/CreateEventForm';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContextProvider';
import { nativeNavigate } from '@/lib/utils';

export default function CreateEventClient() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();

    const { initialDate, initialEndDate } = React.useMemo(() => {
        let dateParam = searchParams.get('date');
        let endDateParam = searchParams.get('end_date');

        const parseDate = (param: string | null) => {
            if (!param) return undefined;
            if (param.endsWith('/')) param = param.slice(0, -1);
            const parsed = new Date(param);
            return isNaN(parsed.getTime()) ? undefined : parsed;
        };

        return {
            initialDate: parseDate(dateParam),
            initialEndDate: parseDate(endDateParam)
        };
    }, [searchParams]);

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
                        <h1 className="text-2xl font-bold tracking-tight">Create New Event</h1>
                        <p className="text-white/60 text-sm">Schedule a new event or leave request</p>
                    </div>
                </div>

                {/* Form Container */}
                <div className="bg-[#10111a] border border-white/5 rounded-2xl p-6 lg:p-8 shadow-xl backdrop-blur-sm">
                    <CreateEventForm 
                        initialDate={initialDate}
                        initialEndDate={initialEndDate}
                        onSuccess={() => nativeNavigate('/events', router, 'CreateEvent (Success)')} 
                    />
                </div>

            </div>
        </div>
    );
}
