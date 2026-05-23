import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { inventoryService } from '@/services/inventory/inventoryService';
import { DateSelector } from "@/components/ui/selectors/DateSelector";
import { DropdownSelector } from "@/components/ui/selectors/DropdownSelector";
import { Camera, Eye, Music, Lightbulb, Zap, Monitor, Sofa, Heart, MoreHorizontal, Package, X, FileText, Send } from "lucide-react";

interface InventoryRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InventoryRequestModal({ isOpen, onClose }: InventoryRequestModalProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        itemCategory: 'Camera',
        description: '',
        startDate: '',
        endDate: '',
        purpose: ''
    });

    const categories = [
        "Camera", "Lens", "Audio", "Lights", "Cables", "IT", "Furniture", "decoration", "Other"
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await inventoryService.createRequest({
                ...formData,
                status: 'pending'
            });
            onClose();
            // Optional: Show success toast
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[var(--glass-liquid-bg)] border border-[#ffffff1a] rounded-2xl shadow-2xl z-[70] p-6"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                                <Package className="text-blue-400" size={24} />
                                Request Equipment
                            </h2>
                            <button onClick={onClose} className="text-gray-400 hover:text-foreground transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">

                            {/* Category & Description */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-0.5">
                                    <DropdownSelector 
                                        label="Category"
                                        value={formData.itemCategory}
                                        onChange={val => setFormData({ ...formData, itemCategory: val })}
                                        options={[
                                            { id: 'Camera', label: 'Camera', icon: <Camera size={14} /> },
                                            { id: 'Lens', label: 'Lens', icon: <Eye size={14} /> },
                                            { id: 'Audio', label: 'Audio', icon: <Music size={14} /> },
                                            { id: 'Lights', label: 'Lights', icon: <Lightbulb size={14} /> },
                                            { id: 'Cables', label: 'Cables', icon: <Zap size={14} /> },
                                            { id: 'IT', label: 'IT', icon: <Monitor size={14} /> },
                                            { id: 'Furniture', label: 'Furniture', icon: <Sofa size={14} /> },
                                            { id: 'decoration', label: 'decoration', icon: <Heart size={14} /> },
                                            { id: 'Other', label: 'Other', icon: <MoreHorizontal size={14} /> },
                                        ]}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-400 block">Item Name / Details</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Sony A7IV"
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-foreground outline-none focus:border-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
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
                                        disabledBefore={formData.startDate ? new Date(formData.startDate) : undefined}
                                    />
                                </div>
                            </div>

                            {/* Purpose */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-400 block flex items-center gap-2">
                                    <FileText size={14} /> Purpose / Notes
                                </label>
                                <textarea
                                    required
                                    rows={3}
                                    placeholder="Briefly describe why you need this..."
                                    value={formData.purpose}
                                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-3 py-2 text-foreground outline-none focus:border-blue-500 resize-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="pt-4 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-gray-400 hover:text-foreground transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-500 text-foreground rounded-lg font-medium transition-colors shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? 'Submitting...' : (
                                        <>
                                            <Send size={16} /> Submit Request
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
