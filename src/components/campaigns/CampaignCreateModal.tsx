import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { CampaignService } from '@/services/campaignService';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';

interface CampaignCreateModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: (id: string) => void;
}

export const CampaignCreateModal: React.FC<CampaignCreateModalProps> = ({ isOpen, onClose, onCreated }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: ''
    });

    if (!isOpen || !user) return null;

    const isGuest = user.role !== 'admin' && user.role !== 'team';

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const id = await CampaignService.createCampaign({
                name: formData.name,
                description: formData.description,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            }, {
                uid: user.uid,
                role: user.role || 'guest',
                name: user.name || 'User'
            });
            toast.success('Campaign created successfully');
            onCreated(id);
            onClose();
        } catch (error) {
            console.error(error);
            toast.error('Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                    <h2 className="text-lg font-bold text-white">New Campaign</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Guest Warning */}
                    {isGuest && (
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
                            <Info size={18} className="text-blue-400 mt-0.5" />
                            <div className="text-sm text-blue-200">
                                <p className="font-semibold text-blue-100">Planning Mode</p>
                                <p className="text-xs opacity-80">This campaign will start in <strong>Planning</strong>. A team member will review it before moving to production.</p>
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Campaign Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Summer Festival 2025"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Description</label>
                        <textarea
                            rows={3}
                            placeholder="What are the goals of this campaign?"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm resize-none"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Start Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm flex items-center justify-between",
                                            !formData.startDate ? "text-gray-500" : "text-white font-medium"
                                        )}
                                    >
                                        {formData.startDate ? format(new Date(formData.startDate), 'dd/MM/yyyy') : <span>dd/mm/yyyy</span>}
                                        <CalendarIcon size={16} className="text-gray-500" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#0f172a] border-white/10" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.startDate ? new Date(formData.startDate) : undefined}
                                        onSelect={(date) => setFormData({ ...formData, startDate: date ? date.toISOString() : '' })}
                                        initialFocus
                                        className="text-white"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">End Date</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <button
                                        type="button"
                                        className={cn(
                                            "w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all text-sm flex items-center justify-between",
                                            !formData.endDate ? "text-gray-500" : "text-white font-medium"
                                        )}
                                    >
                                        {formData.endDate ? format(new Date(formData.endDate), 'dd/MM/yyyy') : <span>dd/mm/yyyy</span>}
                                        <CalendarIcon size={16} className="text-gray-500" />
                                    </button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0 bg-[#0f172a] border-white/10" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={formData.endDate ? new Date(formData.endDate) : undefined}
                                        onSelect={(date) => setFormData({ ...formData, endDate: date ? date.toISOString() : '' })}
                                        initialFocus
                                        className="text-white"
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-xl text-gray-400 hover:bg-white/5 hover:text-white transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !formData.startDate || !formData.endDate}
                            className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create Campaign'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
