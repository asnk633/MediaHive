import React from 'react';
import { X, Calendar, Clock, MapPin } from 'lucide-react';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    isMobile?: boolean; // Toggle between Slide-up Drawer and Center Dialog styles
}

export const CreateEventModal = ({ isOpen, onClose, isMobile = true }: CreateEventModalProps) => {
    if (!isOpen) return null;

    const overlayClasses = "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex";
    const containerClasses = isMobile
        ? `${overlayClasses} items-end` // Mobile: Slide up from bottom
        : `${overlayClasses} items-center justify-center`; // Desktop: Center

    const modalClasses = isMobile
        ? "w-full bg-white rounded-t-[32px] p-6 animate-slide-up shadow-[0_-8px_30px_rgba(0,0,0,0.12)]"
        : "w-full max-w-lg bg-white rounded-[24px] p-8 animate-fade-in shadow-2xl";

    return (
        <div className={containerClasses} onClick={onClose}>
            <div className={modalClasses} onClick={e => e.stopPropagation()}>
                {/* Mobile Pull Handle */}
                {isMobile && <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6" />}

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900">Create New Event</h2>
                    <button onClick={onClose} className="p-2 -mr-2 text-gray-400 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form className="space-y-5" onSubmit={e => e.preventDefault()}>
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Event Title</label>
                        <input type="text" placeholder="e.g. Planning Meeting" className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none border" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Date</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input type="date" className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-700">Time</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                                <input type="time" className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl outline-none" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700">Location</label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                            <input type="text" placeholder="Conference Room A" className="w-full pl-10 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:border-blue-500 outline-none transition-all border" />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 mt-2 bg-gradient-to-r from-[#0096FF] to-[#00C2FF] text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-transform">
                        Create Event
                    </button>
                </form>
            </div>
        </div>
    );
};
