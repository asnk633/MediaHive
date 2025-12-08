"use client";

import React from "react";

export default function EventsPage() {
    return (
        <div className="px-4 pb-28 pt-6">
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-[var(--text)]">Events</h1>
            <p className="mt-1 text-[var(--muted)]">Manage your upcoming events.</p>

            <div className="mt-8 flex flex-col items-center justify-center py-12 text-center glass-card rounded-xl border border-[var(--glass-border)]">
                <div className="h-16 w-16 rounded-full bg-[var(--panel)] flex items-center justify-center mb-4">
                    <span className="text-2xl">📅</span>
                </div>
                <h3 className="text-lg font-medium text-[var(--text)]">No events found</h3>
                <p className="text-sm text-[var(--muted)] mt-1 max-w-xs">
                    Scheduled events will appear here. Use the FAB to create a new event.
                </p>
            </div>
        </div>
    );
}
