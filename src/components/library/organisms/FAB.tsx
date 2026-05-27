import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Calendar, CalendarCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';

export const FAB = () => {
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();
    const { canCreateTask, role } = usePermissions();

    const actions = [
        { label: "Request Leave", icon: CalendarCheck, color: "text-amber-400", delay: 0.15, onClick: () => nativeNavigate('/leave/request', router, 'FAB (Request Leave)'), visible: role === 'team' },
        { label: "New Task", icon: CheckSquare, color: "text-green-400", delay: 0.1, onClick: () => nativeNavigate('/tasks/new', router, 'FAB (New Task)'), visible: canCreateTask },
        { label: "New Event", icon: Calendar, color: "text-purple-400", delay: 0.05, onClick: () => nativeNavigate('/events/new', router, 'FAB (New Event)'), visible: ['admin', 'manager', 'member', 'team'].includes(role) },
    ];

    const visibleActions = actions.filter(a => a.visible);

    if (visibleActions.length === 0) return null;

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-4">
                <motion.button
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0096FF] to-[#00C2FF] text-foreground shadow-xl shadow-blue-500/30 flex items-center justify-center relative z-20"
                    onClick={() => setIsOpen(!isOpen)}
                    whileTap={{ scale: 0.9 }}
                    animate={{ rotate: isOpen ? 135 : 0 }}
                >
                    <Plus size={32} />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <div className="absolute bottom-20 flex flex-col items-center gap-4 w-max">
                            {visibleActions.map((action) => (
                                <motion.div
                                    key={action.label}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    transition={{ delay: action.delay }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="bg-black/80 backdrop-blur-md border border-[#ffffff1a] text-foreground text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg">
                                        {action.label}
                                    </span>
                                    <button
                                        onClick={() => {
                                            action.onClick();
                                            setIsOpen(false);
                                        }}
                                        className={`w-12 h-12 rounded-full bg-black/40 backdrop-blur-md border border-[#ffffff1a] shadow-lg flex items-center justify-center hover:scale-110 hover:bg-foreground/10 transition-all ${action.color}`}
                                    >
                                        <action.icon size={20} />
                                    </button>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </>
    );
};
