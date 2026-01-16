import React from 'react';
import { HelpCircle } from 'lucide-react';

export function HelpInfoCard() {
    return (
        <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <HelpCircle size={20} />
                </div>
                <div className="space-y-4">
                    <p className="text-base font-semibold text-foreground">Need help?</p>
                    <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">Guests can request tasks and events directly.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">You cannot assign team members; admins handle assignment.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">Priorities are managed by the Media Team based on workload.</span>
                        </li>
                        <li className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                            <span className="text-sm text-muted-foreground leading-relaxed">For account changes or role updates, please contact Thaiba Garden HQ.</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
