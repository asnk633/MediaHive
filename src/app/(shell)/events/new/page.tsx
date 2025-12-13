"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { CreateEventForm } from '@/components/library/organisms/CreateEventForm';
import { ArrowLeft } from 'lucide-react';

export default function NewEventPage() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-gray-50/50 dark:bg-black px-4 sm:px-6 pb-24" style={{ paddingTop: '120px' }}>
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-8">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create New Event</h1>
                </div>

                {/* Form Card */}
                <div className="bg-white dark:bg-[#10111a] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-800">
                    <CreateEventForm
                        onSuccess={() => router.push('/events')}
                        onCancel={() => router.back()}
                        isModal={false}
                    />
                </div>
            </div>
        </div>
    );
}
