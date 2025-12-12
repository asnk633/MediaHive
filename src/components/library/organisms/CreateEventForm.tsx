import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, AlignLeft, Tag, User, Briefcase } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { EventService } from '@/services/events';
import { useRole } from '@/app/(shell)/RoleContext';

interface CreateEventFormProps {
    initialDate?: Date;
    onSuccess: () => void;
    onCancel?: () => void; // Optional cancel action
    isModal?: boolean; // To adjust padding if needed
}

export const CreateEventForm = ({ initialDate, onSuccess, onCancel, isModal = false }: CreateEventFormProps) => {
    const { user } = useRole();
    const [loading, setLoading] = useState(false);

    // Form State
    const [title, setTitle] = useState('');
    const [date, setDate] = useState('');
    const [time, setTime] = useState('');
    const [location, setLocation] = useState('');
    const [description, setDescription] = useState('');
    const [department, setDepartment] = useState('Operations');
    const [type, setType] = useState('meeting');
    const [createdById, setCreatedById] = useState('');

    const mockMembers = [
        { id: 'u2', name: 'KMS Pallikkunnu' },
        { id: 'u3', name: 'Shukoor Rahman' },
        { id: 'u4', name: 'Sarah Designer' },
    ];

    // Initialize State
    useEffect(() => {
        if (initialDate) {
            setDate(initialDate.toISOString().split('T')[0]);
        } else {
            setDate('');
        }
        setTime('10:00');
        setTitle('');
        setLocation('');
        setDescription('');
        setDepartment('Operations');
        setType('meeting');
        setCreatedById(user?.id || '');
    }, [initialDate, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !date || !time) return;

        setLoading(true);
        try {
            // Combine Date & Time
            const dateTime = new Date(`${date}T${time}`);

            let finalCreatedBy = { uid: user?.id || 'anon', name: user?.name || 'Guest' };

            // Admin Logic
            if (user?.role === 'admin') {
                if (createdById === user?.id) {
                    finalCreatedBy = { uid: user.id, name: user.name };
                } else {
                    const selected = mockMembers.find(m => m.id === createdById);
                    if (selected) {
                        finalCreatedBy = { uid: selected.id, name: selected.name };
                    }
                }
            }

            await EventService.addEvent({
                title,
                date: Timestamp.fromDate(dateTime),
                location,
                description,
                department,
                type: type as any,
                createdBy: finalCreatedBy,
            });
            onSuccess();
        } catch (error) {
            console.error("Failed to create event:", error);
            alert("Failed to create event. Working offline?");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Event Title</label>
                <input
                    type="text"
                    required
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Planning Meeting"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all outline-none border text-gray-900 dark:text-white"
                />
            </div>

            {/* Admin Only: Created By */}
            {user?.role === 'admin' && (
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Created By</label>
                    <div className="relative">
                        <User className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <select
                            value={createdById}
                            onChange={e => setCreatedById(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl outline-none appearance-none text-gray-900 dark:text-white"
                        >
                            <option value={user?.id}>Myself ({user?.name})</option>
                            {mockMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Date</label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="date"
                            required
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl outline-none text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Time</label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-3.5 text-gray-400" size={18} />
                        <input
                            type="time"
                            required
                            value={time}
                            onChange={e => setTime(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl outline-none text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Location</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        placeholder="Conference Room A"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 outline-none transition-all border text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Department</label>
                <div className="relative">
                    <Briefcase className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        placeholder="Operations"
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 outline-none transition-all border text-gray-900 dark:text-white"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Type</label>
                <div className="relative">
                    <Tag className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <select
                        value={type}
                        onChange={e => setType(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl outline-none appearance-none text-gray-900 dark:text-white"
                    >
                        <option value="meeting">Meeting</option>
                        <option value="workshop">Workshop</option>
                        <option value="deadline">Deadline</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">Description</label>
                <div className="relative">
                    <AlignLeft className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        placeholder="Details about the event..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-transparent rounded-xl focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 outline-none transition-all border text-gray-900 dark:text-white resize-none"
                    />
                </div>
            </div>

            <div className={`flex gap-3 ${isModal ? 'pt-2' : 'pt-4 border-t border-gray-100 dark:border-gray-800 mt-6'}`}>
                {onCancel && (
                    <button
                        type="button"
                        onClick={onCancel}
                        className="flex-1 py-4 text-gray-600 dark:text-gray-300 font-bold bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all"
                    >
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] py-4 bg-gradient-to-r from-[#0096FF] to-[#00C2FF] hover:opacity-90 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? 'Creating...' : 'Create Event'}
                </button>
            </div>
        </form>
    );
};
