import React from 'react';
import { Bell, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/contexts/ThemeContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface UserPreferencesProps {
    notifications: boolean;
    setNotifications: (v: boolean) => void;
    expoPushToken: string;
    setExpoPushToken: (v: string) => void;
    onSavePushToken: () => Promise<void>;
    savingToken?: boolean;
}

export function UserPreferences({
    notifications,
    setNotifications,
    expoPushToken,
    setExpoPushToken,
    onSavePushToken,
    savingToken
}: UserPreferencesProps) {
    const { theme, setTheme } = useTheme();

    return (
        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col gap-6">
            <ToggleRow
                icon={Bell}
                label="Push Notifications"
                helper="Receive updates about your tasks"
                checked={notifications}
                onChange={setNotifications}
            />

            <div className="flex flex-col gap-4 py-1 border-t border-border pt-6">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-surface text-muted">
                        <Bell size={18} className="text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">Expo Push Token (Foundation)</p>
                        <p className="text-xs text-muted-foreground">For simulated pushes and testing admin/guest mobile alerts</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <Input
                        id="expoPushToken"
                        placeholder="ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
                        value={expoPushToken}
                        onChange={(e) => setExpoPushToken(e.target.value)}
                        className="bg-foreground/[0.03] border-foreground/10 rounded-xl focus:bg-foreground/[0.08] transition-all flex-1 h-11"
                    />
                    <Button
                        onClick={onSavePushToken}
                        isLoading={savingToken}
                        className="rounded-xl font-bold bg-blue-600 hover:bg-blue-500 text-white h-11 px-6"
                    >
                        Save Token
                    </Button>
                </div>
            </div>
            
            <div className="flex flex-col gap-4 py-1">
                <div className="flex items-center gap-4">
                    <div className="p-2 rounded-lg bg-surface text-muted">
                        <Palette size={18} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-foreground">App Theme</p>
                        <p className="text-xs text-muted-foreground">Select your preferred aesthetic</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                    <ThemeCard 
                        name="Midnight Indigo" 
                        id="midnight" 
                        current={theme} 
                        onClick={() => setTheme('midnight')} 
                        colors={['#02040a', '#6366f1']}
                    />
                    <ThemeCard 
                        name="Golden Glass" 
                        id="golden" 
                        current={theme} 
                        onClick={() => setTheme('golden')} 
                        colors={['#0a0a05', '#FFB800']}
                    />
                    <ThemeCard 
                        name="Luminous White" 
                        id="luminous" 
                        current={theme} 
                        onClick={() => setTheme('luminous')} 
                        colors={['#f8fafc', '#0284c7']}
                    />
                </div>
            </div>
        </div>
    );
}

function ThemeCard({ name, id, current, onClick, colors }: { name: string, id: string, current: string, onClick: () => void, colors: string[] }) {
    const isActive = current === id;
    return (
        <button 
            onClick={onClick}
            className={cn(
                "flex flex-col gap-3 p-3 rounded-xl border text-left transition-all",
                isActive ? "border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--accent-primary-rgb),0.15)]" : "border-border hover:bg-surface hover:border-foreground/20"
            )}
        >
            <div className="h-10 w-full rounded-lg flex overflow-hidden border border-black/10 shadow-inner">
                <div className="flex-1" style={{ backgroundColor: colors[0] }} />
                <div className="w-1/3" style={{ backgroundColor: colors[1] }} />
            </div>
            <span className={cn("text-xs font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>{name}</span>
        </button>
    );
}

function ToggleRow({ icon: Icon, label, helper, checked, onChange }: { icon: any; label: string; helper?: string; checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-surface text-muted">
                    <Icon size={18} />
                </div>
                <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
                </div>
            </div>

            <Switch
                checked={checked}
                onCheckedChange={onChange}
            />
        </div>
    );
}
