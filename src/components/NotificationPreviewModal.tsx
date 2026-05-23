'use client';

import React from 'react';
import ModalBase from '@/components/ModalBase';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { AppNotification } from '@/types/notification';

interface NotificationPreviewModalProps {
    open: boolean;
    onClose: () => void;
    data: {
        title: string;
        body: string;
        // Add other fields to preview if needed
    };
}

export default function NotificationPreviewModal({ open, onClose, data }: NotificationPreviewModalProps) {
    // Create a mock notification object for preview
    const mockNotification: AppNotification = {
        id: 'preview-id',
        title: data.title || 'No Title',
        message: data.body || 'No Content',
        type: 'announcement', // Default or make dynamic if form supports it
        created_at: { seconds: Date.now() / 1000 } as any, // Mock timestamp
        read: false,
        user_id: 'preview-user',
        priority: 'medium',
        entity_type: 'announcement',
        entity_id: 'preview-entity-id',
        tenant_id: 'preview-tenant'
    };

    return (
        <ModalBase open={open} onClose={onClose} panelClass="fixed inset-x-0 bottom-0 z-[70] mx-auto max-w-xl rounded-t-2xl bg-[#102220] p-6 text-foreground border-t border-[#ffffff1a] shadow-2xl">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-indigo-300">
                    Preview Notification
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 hover:bg-foreground/10 rounded-lg transition-colors text-foreground/70 hover:text-foreground"
                >
                    ✕
                </button>
            </div>

            <div className="bg-black/20 rounded-xl p-4 border border-foreground/5 mb-6">
                <p className="text-sm text-gray-400 mb-2 uppercase tracking-wider font-bold">Preview</p>
                <div className="pointer-events-none">
                    <NotificationItem
                        notification={mockNotification as any}
                        onRead={() => { }}
                        onArchive={() => { }}
                    />
                </div>
            </div>

            <div className="flex justify-end pt-2">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-foreground/10 hover:bg-foreground/15 text-foreground font-medium rounded-xl transition-all"
                >
                    Close Preview
                </button>
            </div>
        </ModalBase>
    );
}
