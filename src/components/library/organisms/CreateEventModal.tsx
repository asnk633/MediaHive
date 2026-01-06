import React from 'react';
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
    if (!isOpen) return null;

    const overlayClasses = "fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex";
    const containerClasses = isMobile
        ? `${overlayClasses} items-end`
        : `${overlayClasses} items-center justify-center`;

    const modalClasses = isMobile
        ? "w-full bg-[#10111a] rounded-t-[32px] p-6 animate-slide-up shadow-[0_-8px_30px_rgba(0,0,0,0.5)] max-h-[90vh] overflow-y-auto border-t border-[#ffffff1a]"
        : "w-full max-w-lg bg-[#10111a] rounded-[24px] p-8 animate-fade-in shadow-2xl border border-[#ffffff1a]";

    return (
        <div className={containerClasses} onClick={onClose}>
            <div className={modalClasses} onClick={e => e.stopPropagation()}>
                {/* Mobile Pull Handle */}
                {isMobile && <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6" />}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-white">Create New Event</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-white/50 hover:bg-white/10 hover:text-white rounded-full transition-colors">
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
        </div>
    );
};
