import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { CreateEventForm } from './CreateEventForm';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
    initialDate?: Date;
    forceSystemEvent?: boolean;
}

export const CreateEventModal = ({ isOpen, onClose, isMobile = true, initialDate, forceSystemEvent }: CreateEventModalProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const overlayClasses = "fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex";
    const containerClasses = isMobile
        ? `${overlayClasses} items-end`
        : `${overlayClasses} items-center justify-center`;

    const modalClasses = isMobile
        ? "w-full bg-[#10111a] rounded-t-[32px] p-6 animate-slide-up shadow-[0_-8px_30px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto border-t border-[#ffffff1a] relative z-[101]"
        : "w-full max-w-lg bg-[#10111a] rounded-[24px] p-8 animate-fade-in shadow-2xl border border-[#ffffff1a] relative z-[101]";

    return createPortal(
        <div className={containerClasses} onClick={(e) => {
            // Only close if clicking directly on the overlay backdrop (not on children)
            if (e.target === e.currentTarget) {
                onClose();
            }
        }}>
            <div className={modalClasses} onClick={e => e.stopPropagation()}>
                {/* Mobile Pull Handle */}
                {isMobile && <div className="w-12 h-1.5 bg-foreground/10 rounded-full mx-auto mb-6" />}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-foreground">Create New Event</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-foreground/70 hover:bg-foreground/10 hover:text-foreground rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <CreateEventForm
                    initialDate={initialDate}
                    onSuccess={onClose}
                    isModal={true}
                    forceSystemEvent={forceSystemEvent}
                />
            </div>
        </div>,
        document.body
    );
};
