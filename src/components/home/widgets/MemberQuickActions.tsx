import React from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { nativeNavigate } from '@/lib/utils';

export const MemberQuickActions = () => {
    const router = useRouter();

    return (
        <motion.div
            className="group relative overflow-hidden bg-gradient-to-br from-blue-600 to-violet-600 rounded-2xl p-6 shadow-xl cursor-pointer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => nativeNavigate('/tasks/new', router, 'MemberQuickActions (New Request)')}
        >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-20 transition-opacity" />

            <div className="flex items-center justify-between relative z-10">
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">New Request</h3>
                    <p className="text-blue-100/80 text-sm">Start a new project or task</p>
                </div>
                <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm shadow-sm group-hover:bg-white/30 transition-colors">
                    <Plus size={24} className="text-white" />
                </div>
            </div>
        </motion.div>
    );
};
