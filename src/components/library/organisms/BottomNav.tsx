import React from 'react';
import { Home, CheckSquare, Calendar, User } from 'lucide-react';
import { motion } from 'framer-motion';

/* Ideally this component accepts active tab state props */
export const BottomNav = ({ activeTab = 'home' }: { activeTab?: string }) => {
    const items = [
        { id: 'home', icon: Home, label: 'Home' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'fab-spacer', icon: null, label: null }, // Spacer for FAB centered
        { id: 'events', icon: Calendar, label: 'Events' },
        { id: 'profile', icon: User, label: 'Profile' }
    ];

    return (
        <motion.nav
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="fixed bottom-0 left-0 w-full bg-foreground/95 backdrop-blur-xl border-t border-gray-200/50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] flex items-center justify-around z-30 px-4"
            style={{
                height: 'calc(4rem + env(safe-area-inset-bottom))',
                paddingBottom: 'env(safe-area-inset-bottom)'
            }}
        >
            {items.map((item) => {
                if (item.id === 'fab-spacer') return <div key="spacer" className="w-16" />;

                const isActive = activeTab === item.id;
                const Icon = item.icon!;

                return (
                    <button
                        key={item.id}
                        className={`flex flex-col items-center justify-center w-12 h-full transition-colors ${isActive ? 'text-[#0096FF]' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <Icon size={24} className={isActive ? 'stroke-[2.5px]' : 'stroke-2'} />
                        <span className="text-[10px] font-medium mt-0.5">{item.label}</span>
                    </button>
                );
            })}
        </motion.nav>
    );
};
