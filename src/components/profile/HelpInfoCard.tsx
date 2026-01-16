import React, { useState } from 'react';
import { HelpCircle, BookOpen } from 'lucide-react';
import { GuestGuideModal } from '@/components/onboarding/GuestGuideModal';

export function HelpInfoCard() {
    const [showGuide, setShowGuide] = useState(false);

    return (
        <>
            <div className="bg-card border border-border rounded-2xl p-6">
                <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                        <HelpCircle size={20} />
                    </div>
                    <div className="space-y-4 flex-1">
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

                        <button
                            onClick={() => setShowGuide(true)}
                            className="w-full mt-4 py-2.5 rounded-xl bg-muted/50 hover:bg-muted text-primary text-sm font-semibold transition-colors flex items-center justify-center gap-2 border border-border"
                        >
                            <BookOpen size={16} />
                            View Full Guest Guide
                        </button>
                    </div>
                </div>
            </div>

            <GuestGuideModal open={showGuide} onClose={() => setShowGuide(false)} />
        </>
    );
}
