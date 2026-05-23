import React, { useEffect, useState } from 'react';
import { deviceRequestService } from '@/services/deviceRequestService';
import { DeviceRequest } from '@/types/deviceRequest';
import { AlertTriangle, Clock, Calendar, User } from 'lucide-react';
import { differenceInDays, formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

export function OverdueAlertsWidget() {
    const [overdueItems, setOverdueItems] = useState<DeviceRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadOverdueItems();
    }, []);

    const loadOverdueItems = async () => {
        try {
            // Fetch all requests - Ideally API would support ?status=issued&overdue=true
            // Client side filter for now as per plan
            const allRequests = await deviceRequestService.getAllRequests();
            const now = new Date();

            const overdue = allRequests.filter(req => {
                if (req.status !== 'issued') return false;

                const endDate = new Date(req.endDate as any); // Handle string or timestamp
                return endDate < now;
            });

            setOverdueItems(overdue);
        } catch (error) {
            console.error("Failed to load overdue items", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return null; // Don't show anything while loading to avoid layout shift, or show skeleton
    if (overdueItems.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 bg-red-500/10 rounded-[18px] p-6 relative overflow-hidden shadow-sm"
        >
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/20 blur-[50px] rounded-full pointer-events-none" />

            <div className="flex items-center gap-3 mb-4 text-red-400">
                <div className="p-2 bg-red-500/20 rounded-lg animate-pulse">
                    <AlertTriangle size={24} />
                </div>
                <h2 className="text-xl font-bold text-foreground">Attention: Overdue Equipment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueItems.map(req => {
                    const daysOverdue = differenceInDays(new Date(), new Date(req.endDate as any));
                    return (
                        <div key={req.id} className="bg-surface rounded-[18px] p-4 transition-colors shadow-sm hover:shadow-md">
                            <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-foreground">{req.assignedItemName || req.itemCategory}</h3>
                                <span className="text-xs font-bold text-red-400 bg-red-500/10 px-2 py-1 rounded-full">
                                    {daysOverdue} days overdue
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-slate-400">
                                <div className="flex items-center gap-2">
                                    <User size={14} />
                                    <span className="text-foreground">{req.requester.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar size={14} />
                                    <span>Due: {new Date(req.endDate as any).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </motion.div>
    );
}
