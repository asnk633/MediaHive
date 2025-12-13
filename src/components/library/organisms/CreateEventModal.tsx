import React from 'react';
import { X } from 'lucide-react';
import { CreateEventForm } from './CreateEventForm';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean;
    initialDate?: Date;
}

export const CreateEventModal = ({ isOpen, onClose, isMobile = true, initialDate }: CreateEventModalProps) => {
    if (!isOpen) return null;

    const overlayClasses = "fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex";
    const containerClasses = isMobile
        ? `${overlayClasses} items-end`
        : `${overlayClasses} items-center justify-center`;

    const modalClasses = isMobile
        ? "w-full bg-white dark:bg-[#10111a] rounded-t-[32px] p-6 animate-slide-up shadow-[0_-8px_30px_rgba(0,0,0,0.12)] max-h-[90vh] overflow-y-auto"
        : "w-full max-w-lg bg-white dark:bg-[#10111a] rounded-[24px] p-8 animate-fade-in shadow-2xl";

    return (
        <div className={containerClasses} onClick={onClose}>
            <div className={modalClasses} onClick={e => e.stopPropagation()}>
                {/* Mobile Pull Handle */}
                {isMobile && <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-6" />}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Event</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <CreateEventForm
                    initialDate={initialDate}
                    onSuccess={onClose}
                    isModal={true}
                />
            </div>
        </div>
    );
};
