import React from 'react';
import { Search, Bell, Settings } from 'lucide-react';

/* A responsive TopBar that handles mobile/desktop differences via CSS */
export const TopBar = ({ user }: { user?: { name: string, avatar: string } }) => {
    const userName = user?.name || "Shukoor Rahman";
    const userAvatar = user?.avatar || "/default-avatar.png";

    return (
        <header className="fixed top-0 left-0 right-0 h-[72px] bg-foreground/80 backdrop-blur-md border-b border-[var(--color-border)] z-30 flex items-center justify-between px-4 lg:px-8 transition-all">
            {/* Brand */}
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0096FF] to-[#00C2FF] flex items-center justify-center text-foreground font-bold">
                    TG
                </div>
                <span className="font-bold text-lg text-[var(--color-text-primary)] hidden sm:block">Thaiba Garden</span>
            </div>

            {/* Center Search (Hidden on small mobile) */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
                    />
                </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-3 sm:gap-4">
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors relative">
                    <Bell size={20} />
                    <span className="absolute top-1.5 right-2 w-2 h-2 bg-red-500 rounded-full border border-white" />
                </button>
                <button className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
                    <Settings size={20} />
                </button>

                {/* Profile */}
                <div className="flex items-center gap-3 pl-2 sm:border-l border-gray-200">
                    <div className="text-right hidden lg:block">
                        <div className="text-sm font-bold text-gray-900">{userName}</div>
                        <div className="text-xs text-gray-500">Admin</div>
                    </div>
                    <img src={userAvatar} alt="Profile" className="w-9 h-9 rounded-full border border-gray-200 shadow-sm" />
                </div>
            </div>
        </header>
    );
};
