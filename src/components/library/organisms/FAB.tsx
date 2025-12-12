import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, CheckSquare, Calendar, X } from 'lucide-react';

export const FAB = () => {
    const [isOpen, setIsOpen] = useState(false);

    const actions = [
        { label: "New Task", icon: CheckSquare, color: "bg-green-500", delay: 0.1 },
        { label: "New Event", icon: Calendar, color: "bg-purple-500", delay: 0.05 },
    ];

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-white/60 backdrop-blur-sm z-40"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-4">
                <motion.button
                    className="w-16 h-16 rounded-full bg-gradient-to-br from-[#0096FF] to-[#00C2FF] text-white shadow-xl shadow-blue-500/30 flex items-center justify-center relative z-20"
                    onClick={() => setIsOpen(!isOpen)}
                    whileTap={{ scale: 0.9 }}
                    animate={{ rotate: isOpen ? 135 : 0 }}
                >
                    <Plus size={32} />
                </motion.button>

                <AnimatePresence>
                    {isOpen && (
                        <div className="absolute bottom-20 flex flex-col items-center gap-4 w-max">
                            {actions.map((action) => (
                                <motion.div
                                    key={action.label}
                                    initial={{ opacity: 0, y: 20, scale: 0.8 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.8 }}
                                    transition={{ delay: action.delay }}
                                    className="flex items-center gap-3"
                                >
                                    <span className="bg-white/90 backdrop-blur text-gray-700 text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                                        {action.label}
                                    </span>
                                    <button className={`${action.color} w-12 h-12 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-110 transition-transform`}>
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
