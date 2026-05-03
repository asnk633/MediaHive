'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContextProvider';
import { CampaignService } from '@/features/campaigns/services/campaignService';
import { nativeNavigate } from '@/lib/utils';
import { toast } from 'sonner';
import { DateSelector } from '@/components/ui/selectors/DateSelector';
import { ArrowLeft, Layout, FileText, Send } from 'lucide-react';

export default function CampaignNewClient() {
    const router = useRouter();
    const { user } = useAuth();
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        if (!formData.name.trim()) {
            toast.error("Campaign name is required");
            return;
        }

        setSubmitting(true);
        try {
            const campaignId = await CampaignService.createCampaign({
                name: formData.name,
                description: formData.description,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
            }, {
                uid: user.uid,
                role: user.role,
                name: user.name
            });

            toast.success("Campaign created successfully!");
            nativeNavigate(`/campaigns/view?id=${campaignId}`, router, 'CampaignNew (Success)');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || "Failed to create campaign");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] p-4 pb-20 md:p-8">
            <div className="max-w-3xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <button
                        onClick={() => router.back()}
                        className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm"
                    >
                        <ArrowLeft size={16} /> Back
                    </button>
                    <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                        <Layout className="text-blue-500" />
                        Create New Campaign
                    </h1>
                    <p className="text-gray-400 mt-2">Initialize a new media campaign for your institution.</p>
                </div>

                {/* Form Card */}
                <form onSubmit={handleSubmit} className="bg-white/5 border border-[#ffffff1a] rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
                    <div className="space-y-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <Layout size={14} className="text-blue-400" />
                                Campaign Name
                            </label>
                            <input
                                type="text"
                                placeholder="E.g. Summer Festival 2026"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full bg-[#1e293b] border border-[#ffffff1a] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                                <FileText size={14} className="text-blue-400" />
                                Description
                            </label>
                            <textarea
                                placeholder="Describe the goals and scope of this campaign..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full bg-[#1e293b] border border-[#ffffff1a] rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all min-h-[120px]"
                            />
                        </div>

                        {/* Dates Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-0.5">
                                <DateSelector 
                                    label="Start Date"
                                    date={formData.startDate ? new Date(formData.startDate) : undefined}
                                    onChange={date => setFormData({ ...formData, startDate: date ? date.toISOString().split('T')[0] : '' })}
                                />
                            </div>
                            <div className="space-y-0.5">
                                <DateSelector 
                                    label="End Date"
                                    date={formData.endDate ? new Date(formData.endDate) : undefined}
                                    onChange={date => setFormData({ ...formData, endDate: date ? date.toISOString().split('T')[0] : '' })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-end gap-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-3 text-gray-400 font-semibold hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-xl font-bold shadow-xl shadow-blue-900/40 transition-all hover:scale-[1.02] flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Initializing...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Create Campaign
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Footer Info */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                    <div className="text-blue-400 shrink-0 mt-0.5">
                        <Send size={20} />
                    </div>
                    <div className="text-sm text-blue-200/70 leading-relaxed">
                        <span className="text-blue-300 font-bold block mb-1 uppercase text-xs tracking-wider">Note</span>
                        New campaigns are created in the <span className="text-blue-400 font-semibold italic">Planning</span> phase by default.
                        You can add tasks and production milestones once the campaign is initialized.
                    </div>
                </div>
            </div>
        </div>
    );
}
