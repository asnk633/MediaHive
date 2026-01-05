"use client";
import React from 'react';
import { ChevronRight, LogOut, Bell, Moon, Smartphone, HelpCircle, Shield, User } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "@/firebase/client";
import { cn } from "@/lib/utils";
import { NotificationRuleService } from "@/services/notificationRuleService";
import { NotificationRule } from "@/types/notificationRules";

export default function SettingsPage() {
    const { user } = useAuth();
    const [notifications, setNotifications] = React.useState(true);
    const [rules, setRules] = React.useState<NotificationRule[]>([]);

    React.useEffect(() => {
        if (user?.role === 'admin') {
            NotificationRuleService.getActiveRules().then(setRules);
        }
    }, [user]);

    const handleRuleToggle = async (ruleId: string, enabled: boolean) => {
        // Optimistic update
        setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled } : r));
        try {
            await NotificationRuleService.toggleRule(ruleId, enabled);
        } catch (error) {
            console.error("Failed to toggle rule:", error);
            // Revert
            setRules(prev => prev.map(r => r.id === ruleId ? { ...r, enabled: !enabled } : r));
        }
    };

    return (
        <div className="flex flex-col gap-6 px-4 pt-20 pb-32 max-w-lg mx-auto min-h-screen">
            <header>
                <h1 className="text-3xl font-bold text-[var(--text-primary)]">Settings</h1>
                <p className="text-[var(--text-secondary)]">Manage your app preferences.</p>
            </header>

            {/* User Info (Read-Only) */}
            <section className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Account</h3>
                </div>
                <div className="p-4">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-[var(--bg-panel)] text-[var(--text-muted)]">
                            <User size={18} />
                        </div>
                        <div>
                            <span className="text-sm font-medium text-[var(--text-primary)]">{user?.name || 'User'}</span>
                            <p className="text-xs text-[var(--text-secondary)] capitalize">{user?.role || 'guest'}</p>
                        </div>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-3">
                        Contact admin to change your role
                    </p>
                </div>
            </section>

            {/* General Settings */}
            <section className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">General</h3>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                    <ToggleRow icon={Bell} label="Push Notifications" checked={notifications} onChange={setNotifications} />
                </div>
            </section>

            {/* Admin: Notification Rules */}
            {user?.role === 'admin' && (
                <section className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
                    <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
                        <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider flex justify-between items-center">
                            <span>Notification Rules (Admin)</span>
                            <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full">Phase 1</span>
                        </h3>
                    </div>
                    <div className="divide-y divide-[var(--border-subtle)]">
                        {rules.map(rule => (
                            <ToggleRow
                                key={rule.id}
                                icon={HelpCircle} // Using HelpCircle as generic rule icon, or maybe Bell
                                label={rule.name}
                                checked={rule.enabled}
                                onChange={(val) => handleRuleToggle(rule.id, val)}
                            />
                        ))}
                        {rules.length === 0 && (
                            <div className="p-4 text-sm text-[var(--text-secondary)]">Loading rules...</div>
                        )}
                    </div>
                </section>
            )}

            {/* Support */}
            <section className="bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-subtle)]">
                <div className="px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-panel)]">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Support</h3>
                </div>
                <div className="divide-y divide-[var(--border-subtle)]">
                    <SettingsRow icon={HelpCircle} label="Help & Support" onClick={() => { }} />
                    <SettingsRow icon={Shield} label="Privacy Policy" onClick={() => { }} />
                    <SettingsRow icon={Smartphone} label="App Info" value="v1.0.0" onClick={() => { }} />
                </div>
            </section>

            {/* Logout */}
            <button
                onClick={async () => {
                    try {
                        await signOut(auth);
                        localStorage.clear();
                        window.location.href = '/login';
                    } catch (error) {
                        console.error('Error signing out:', error);
                    }
                }}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium transition-colors border border-red-200 dark:border-red-800"
            >
                <LogOut size={18} />
                Sign Out
            </button>

            <div className="text-center text-xs text-gray-400 mt-4">
                Thaiba Media Manager v1.0.0<br />
                Build 2024.12
            </div>
        </div>
    );
}

function SettingsRow({ icon: Icon, label, value, onClick }: { icon: any; label: string; value?: string; onClick?: () => void }) {
    return (
        <div onClick={onClick} className="flex items-center justify-between p-4 hover:bg-[var(--bg-panel)] cursor-pointer transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-[var(--bg-panel)] text-[var(--text-muted)]">
                    <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className="text-xs text-[var(--text-secondary)]">{value}</span>}
                <ChevronRight size={16} className="text-[var(--text-muted)]" />
            </div>
        </div>
    );
}

function ToggleRow({ icon: Icon, label, checked, onChange }: { icon: any; label: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between p-4 hover:bg-[var(--bg-panel)] transition-colors">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-[var(--bg-panel)] text-[var(--text-muted)]">
                    <Icon size={18} />
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)]">{label}</span>
            </div>
            <button
                onClick={() => onChange(!checked)}
                className={cn(
                    "w-11 h-6 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/50",
                    checked ? "bg-blue-600" : "bg-gray-300 dark:bg-gray-600"
                )}
            >
                <span className={cn("absolute top-1 left-1 bg-white w-4 h-4 rounded-full shadow-sm transition-transform", checked ? "translate-x-5" : "translate-x-0")} />
            </button>
        </div>
    );
}